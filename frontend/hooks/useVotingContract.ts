'use client';


import { useEffect, useState, useCallback } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient, useWatchContractEvent, useSwitchChain } from 'wagmi';
import VotingABI from '../abis/Voting.json';
import toast, { Toaster } from "react-hot-toast";
import { Chain } from 'viem';

// Énumération pour les statuts du workflow
export enum WorkflowStatus {
  RegisteringVoters = 0,
  ProposalsRegistrationStarted = 1,
  ProposalsRegistrationEnded = 2,
  VotingSessionStarted = 3,
  VotingSessionEnded = 4,
  VotesTallied = 5
}


// Type pour les propositions
export type Proposal = {
  description: string;
  voteCount: number;
};

// Type pour les votants
export type Voter = {
  isRegistered: boolean;
  hasVoted: boolean;
  votedProposalId: number;
};

export type VotingEvent = {
  id: string;
  eventName: string;
  blockNumber: number;
  timestamp: number;
  transactionHash: string;
  args: any;
  formattedArgs: string;
};

type VoterRegisteredArgs = { voterAddress: `0x${string}` };
type ProposalRegisteredArgs = { proposalId: bigint };
type VotedArgs = { voter: `0x${string}`; proposalId: bigint };
type WorkflowStatusChangeArgs = { previousStatus: bigint; newStatus: bigint };


export const useVotingContract = () => {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isVoter, setIsVoter] = useState<boolean>(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voterInfo, setVoterInfo] = useState<Voter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const [proposalIds, setProposalIds] = useState<number[]>([0]);
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  type ContractAddresses = {
    [chainId: number]: `0x${string}`;
  };

  const [votingEvents, setVotingEvents] = useState<VotingEvent[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());

  // Définir les adresses du contrat pour différentes chaînes
  const VOTING_CONTRACT_ADDRESSES: ContractAddresses = {
    11155111: '0x4916b8F85a64B774BfF3398Af9c4C108C2Ff852C', // Sepolia Testnet
    31337: '0x5fbdb2315678afecb367f032d93f642f64180aa3',// hardhat
  };

  const OWNER_ADDRESS: ContractAddresses = {
    11155111: '0xb4ef6e1029cD32Ec94020822e61503f550A8a353', // Sepolia
    31337: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',// hardhat
  };

  const FROM_BLOCK: { [chainId: number]: bigint } = {
    11155111: 7921441n, // Sepolia
    31337: 0n,// hardhat
  };

  const chain: Chain = chains[chainId];

  const contractAddress = chainId ? VOTING_CONTRACT_ADDRESSES[chainId] : undefined;
  const numberFromBlock: bigint = chainId ? FROM_BLOCK[chainId] : 0n;


  const [isRegisteredInEvents, setIsRegisteredInEvents] = useState<boolean>(false);
  useEffect(() => {
    const checkVoterRegistration = async () => {
      if (!address || !contractAddress || !publicClient) return;
      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: 'event',
            name: 'VoterRegistered',
            inputs: [{ indexed: false, name: 'voterAddress', type: 'address' }]
          },
          fromBlock: 0n,
          toBlock: 'latest'
        });
        const isRegistered = (logs.some(log =>
          log.args.voterAddress?.toLowerCase() === address.toLowerCase()
        ));
        setIsRegisteredInEvents(isRegistered);
        setIsVoter(isRegistered);
      } catch (error) {
        console.error("Erreur vérification votant:", error);
      }
    };
    checkVoterRegistration();
  }, [address, contractAddress, isConnected, publicClient]);

  // Lecture du statut du workflow
  const { data: workflowStatus, refetch: refetchWorkflowStatus } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VotingABI.abi,
    functionName: 'workflowStatus',
  });

  // Lecture du gagnant
  const { data: winningProposalID, refetch: refetchWinner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VotingABI.abi,
    functionName: 'winningProposalID',
    query: {
      enabled: workflowStatus === WorkflowStatus.VotesTallied,
    }
  });


  const { data: genesisProposalData, refetch: refetchGenesisProposal } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VotingABI.abi,
    functionName: 'getOneProposal',
    args: [BigInt(0)],
    query: {
      enabled: !!contractAddress && isVoter && !isOwner,
    }
  });

  const { data: getVoterData, refetch: refetchVoterData, isLoading: isLoadingVoterData, isError: isErrorVoterData, error: voterDataError } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VotingABI.abi,
    functionName: 'getVoter',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddress && isConnected && !isOwner && isRegisteredInEvents,
    }
  });

  // Fonction pour récupérer une proposition par son ID
  const getProposalById = useCallback(async (proposalId: number) => {
    if (!contractAddress || !publicClient) return null;

    try {

      const result = await publicClient.simulateContract({
        address: contractAddress,
        abi: VotingABI.abi,
        functionName: 'getOneProposal',
        args: [BigInt(proposalId)],
      })
      const isEnabled = !!contractAddress && !!publicClient &&
        (Number(workflowStatus) > WorkflowStatus.RegisteringVoters);

      if (result.result && isEnabled) {
        console.log(`Récupération de la proposition ${proposalId}:`, result.result);

        return {
          description: (result.result as Proposal).description,
          voteCount: Number((result.result as Proposal).voteCount)
        };
      } else {
        return {
          description: '',
          voteCount: 0
        };
      }

    } catch (error) {
      console.error(`Erreur lors de la récupération de la proposition ${proposalId}:`, error);
      return null;
    }
  }, [contractAddress, publicClient]);

  const fetchProposals = useCallback(async () => {
    if (!contractAddress || !isConnected || !publicClient) {
      console.log("Conditions préalables non remplies:", {
        contractAddress: !!contractAddress,
        isConnected,
        publicClient: !!publicClient
      });
      return;
    }

    console.log("Début fetchProposals, statut du workflow:", workflowStatus);

    try {
      if (Number(workflowStatus) <= WorkflowStatus.RegisteringVoters) {
        console.log("Étape d'enregistrement des votants - pas encore de propositions");
        setProposals([]);
        setProposalCount(0);
        return;
      }

      // Vérifiez si nous avons déjà genesisProposalData
      if (genesisProposalData) {
        const genesis = {
          description: (genesisProposalData as Proposal).description,
          voteCount: Number((genesisProposalData as Proposal).voteCount)
        };

        if (genesis.description !== "GENESIS") {
          const manualGenesis = await getProposalById(0);
          if (!manualGenesis || manualGenesis.description !== "GENESIS") {
            console.log("Impossible de récupérer Genesis, phase d'enregistrement pas encore commencée");
            setProposals([]);
            setProposalCount(0);
            return;
          }
        }

        // Continuer avec la récupération des autres propositions...
        let allProposals = [genesis];
        let index = 1;
        let hasMoreProposals = true;

        // Récupérer les propositions une par une
        while (hasMoreProposals) { // Limite pour éviter les boucles infinies
          try {
            const proposal = await getProposalById(index);
            if (proposal && proposal.description) {
              allProposals.push(proposal);
              index++;
            } else {
              console.log(`Aucune proposition trouvée à l'index ${index}`);
              hasMoreProposals = false;
            }
          } catch (error) {
            console.log(`Erreur ou fin des propositions à l'index ${index}:`, error);
            hasMoreProposals = false;
          }
        }

        console.log("Toutes les propositions récupérées:", allProposals);
        setProposals(allProposals);
        setProposalCount(allProposals.length);
      } else {
        console.log("Genesis data pas encore disponible, tentative de récupération manuelle");
        const genesis = await getProposalById(0);
        if (genesis && genesis.description === "GENESIS") {
          setProposals([genesis]);
          setProposalCount(1);
        } else {
          console.log("Impossible de récupérer Genesis manuellement");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des propositions:", error);
    }
  }, [contractAddress, isConnected, publicClient, workflowStatus, genesisProposalData, getProposalById]);

  // Fonction pour écrire au contrat
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Attendre la confirmation de la transaction
  const { isLoading: isConfirming, isError, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Vérifier si l'utilisateur est le propriétaire du contrat
  useEffect(() => {
    const checkOwner = async () => {
      if (!address || !isConnected) {
        setIsOwner(false);
        setLoading(false);
        return;
      }


      const currentOwner = OWNER_ADDRESS[chainId];
      if (address === currentOwner) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }

      setLoading(false);
    };

    checkOwner();
  }, [address, isConnected]);

  useEffect(() => {
    if (isConnected && contractAddress && isVoter) {
      fetchProposals();
    }
  }, [isConnected, contractAddress, fetchProposals, isVoter]);


  const checkVoterStatus = useCallback(() => {
    console.log("Rafraîchissement manuel des données du votant");
    refetchVoterData();
  }, [refetchVoterData]);



  useEffect(() => {
    console.log("Données du votant mises à jour:", getVoterData);
    console.log("État de chargement:", isLoadingVoterData);
    console.log("Erreur?", isErrorVoterData, voterDataError);

    if (getVoterData && !isLoadingVoterData) {
      try {
        const voterDataParsed = getVoterData as {
          isRegistered: boolean;
          hasVoted: boolean;
          votedProposalId: bigint | number;
        };

        const voterInfo = {
          isRegistered: Boolean(voterDataParsed.isRegistered),
          hasVoted: Boolean(voterDataParsed.hasVoted),
          votedProposalId: Number(voterDataParsed.votedProposalId || 0)
        };

        console.log("Voter data parsé:", voterInfo);
        setVoterInfo(voterInfo);
        setIsVoter(voterInfo.isRegistered);
      } catch (error) {
        console.error("Erreur lors du parsing des données du votant:", error);
      }
    }
  }, [getVoterData, isLoadingVoterData, isErrorVoterData]);


  // Fonctions pour interagir avec le contrat
  const registerVoter = useCallback((voterAddress: string) => {
    if (!isOwner) return;
    setLastAction("registerVoter");
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'addVoter',
      args: [voterAddress],
      chain,
      account: address,
    });
  }, [isOwner, writeContract]);


  useEffect(() => {
    const fetchProposalEvents = async () => {
      if (!isConnected || (!isVoter && !isOwner) || !contractAddress) return;

      try {
        setLoading(true);

        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: 'event',
            name: 'ProposalRegistered',
            inputs: [
              {
                indexed: false,
                internalType: 'uint256',
                name: 'proposalId',
                type: 'uint256'
              }
            ]
          },
          fromBlock: 0n,
          toBlock: 'latest'
        });

        const extractedIds = logs.map(log => {
          return Number(log.args.proposalId);
        });

        // S'assurer que l'ID 0 (GENESIS) est inclus
        if (!extractedIds.includes(0)) {
          extractedIds.unshift(0);
        }

        // Trier et dédupliquer
        const uniqueIds = [...new Set(extractedIds)].sort((a, b) => a - b);
        setProposalIds(uniqueIds);
        setLoading(false);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchProposalEvents();
  }, [publicClient, isConnected, isVoter, isOwner, contractAddress]);

  const addProposal = useCallback((description: string) => {
    if (!isVoter) return;
    setLastAction("addProposal");
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'addProposal',
      args: [description],
      chain,
      account: address,
    });
    let sasProposals: Proposal[] = proposals;
    let nextindex: number = proposals.length + 1;

    setProposals(prevProposals => [
      ...prevProposals,
      {
        description: `${description}`,
        voteCount: 0
      }
    ]);
    setProposalCount(nextindex);


  }, [isVoter, writeContract]);

  const vote = useCallback((proposalId: number) => {
    if (!isVoter) return;
    setLastAction("vote");
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'setVote',
      args: [BigInt(proposalId)],
      chain,
      account: address,
    });
  }, [isVoter, writeContract]);


  const startProposalsRegistration = useCallback(() => {
    if (!isOwner) return;
    setLastAction("startProposalsRegistration"); // Correction
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'startProposalsRegistering',
      chain,
      account: address,
    });
  }, [isOwner, writeContract, contractAddress]);

  const endProposalsRegistration = useCallback(() => {
    if (!isOwner) return;
    setLastAction("endProposalsRegistration"); // Correction
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'endProposalsRegistering',
      chain,
      account: address,
    });
  }, [isOwner, writeContract, contractAddress]);

  const startVotingSession = useCallback(() => {
    if (!isOwner) return;
    setLastAction("startVotingSession"); // Ajout manquant
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'startVotingSession',
      chain,
      account: address,
    });
  }, [isOwner, writeContract, contractAddress]);

  const endVotingSession = useCallback(() => {
    if (!isOwner) return;
    setLastAction("endVotingSession"); // Ajout manquant
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'endVotingSession',
      chain,
      account: address,
    });
  }, [isOwner, writeContract, contractAddress]);

  const tallyVotes = useCallback(() => {
    if (!isOwner) return;
    setLastAction("tallyVotes"); // Ajout manquant
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'tallyVotes',
      chain,
      account: address,
    });
  }, [isOwner, writeContract, contractAddress]);




  const fetchEvents = async () => {
    if (!contractAddress || !publicClient) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Définir les types d'événements à récupérer
      const eventTypes = [
        {
          name: 'VoterRegistered',
          inputs: [{ indexed: false, name: 'voterAddress', type: 'address' }]
        },
        {
          name: 'ProposalRegistered',
          inputs: [{ indexed: false, name: 'proposalId', type: 'uint256' }]
        },
        {
          name: 'Voted',
          inputs: [
            { indexed: false, name: 'voter', type: 'address' },
            { indexed: false, name: 'proposalId', type: 'uint256' }
          ]
        },
        {
          name: 'WorkflowStatusChange',
          inputs: [
            { indexed: false, name: 'previousStatus', type: 'uint8' },
            { indexed: false, name: 'newStatus', type: 'uint8' }
          ]
        }
      ];

      // Récupérer les logs pour chaque type d'événement
      const allEvents: VotingEvent[] = [];

      for (const eventType of eventTypes) {
        try {
          const logs = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: eventType.name,
              inputs: eventType.inputs
            },
            fromBlock: numberFromBlock,
            toBlock: 'latest'
          });

          // Récupérer les informations supplémentaires pour chaque log
          for (const log of logs) {
            try {
              // Récupérer le bloc pour obtenir le timestamp
              const block = await publicClient.getBlock({
                blockHash: log.blockHash
              });

              // Formater les arguments en fonction du type d'événement
              let formattedArgs = '';

              if (eventType.name === 'VoterRegistered') {
                // Typer explicitement les arguments
                const args = log.args as VoterRegisteredArgs;
                formattedArgs = `Votant enregistré: ${args.voterAddress}`;
              } else if (eventType.name === 'ProposalRegistered') {
                const args = log.args as ProposalRegisteredArgs;
                formattedArgs = `Proposition enregistrée: #${Number(args.proposalId)}`;
              } else if (eventType.name === 'Voted') {
                const args = log.args as VotedArgs;
                formattedArgs = `Vote de ${args.voter} pour la proposition #${Number(args.proposalId)}`;
              } else if (eventType.name === 'WorkflowStatusChange') {
                const args = log.args as WorkflowStatusChangeArgs;
                const previousStatus = getWorkflowStatusName(Number(args.previousStatus));
                const newStatus = getWorkflowStatusName(Number(args.newStatus));
                formattedArgs = `Changement de statut: ${previousStatus} -> ${newStatus}`;
              }

              allEvents.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                eventName: eventType.name,
                blockNumber: Number(log.blockNumber),
                timestamp: Number(block.timestamp),
                transactionHash: log.transactionHash,
                args: log.args,
                formattedArgs
              });
            } catch (error) {
              console.error(`Erreur lors de la récupération des détails pour le log ${log.transactionHash}:`, error);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des événements ${eventType.name}:`, error);
        }
      }

      // Trier les événements par bloc/timestamp (du plus récent au plus ancien)
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);

      setVotingEvents(allEvents);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      setLoading(false);
    }
  };

  const refreshEventsOnly = useCallback(async () => {
    if (!contractAddress || !publicClient) return;

    console.log("Rafraîchissement du tableau des événements uniquement");
    //setLoading(true);
    try {
      // Code existant pour récupérer les événements
      const eventTypes = [
        {
          name: 'VoterRegistered',
          inputs: [{ indexed: false, name: 'voterAddress', type: 'address' }]
        },
        {
          name: 'ProposalRegistered',
          inputs: [{ indexed: false, name: 'proposalId', type: 'uint256' }]
        },
        {
          name: 'Voted',
          inputs: [
            { indexed: false, name: 'voter', type: 'address' },
            { indexed: false, name: 'proposalId', type: 'uint256' }
          ]
        },
        {
          name: 'WorkflowStatusChange',
          inputs: [
            { indexed: false, name: 'previousStatus', type: 'uint8' },
            { indexed: false, name: 'newStatus', type: 'uint8' }
          ]
        }
      ];

      const allEvents: VotingEvent[] = [];

      for (const eventType of eventTypes) {
        try {
          const logs = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: eventType.name,
              inputs: eventType.inputs
            },
            fromBlock: numberFromBlock,
            toBlock: 'latest'
          });

          // Récupérer les informations supplémentaires pour chaque log
          for (const log of logs) {
            try {
              // Récupérer le bloc pour obtenir le timestamp
              const block = await publicClient.getBlock({
                blockHash: log.blockHash
              });

              // Formater les arguments en fonction du type d'événement
              let formattedArgs = '';

              if (eventType.name === 'VoterRegistered') {
                // Typer explicitement les arguments
                const args = log.args as VoterRegisteredArgs;
                formattedArgs = `Votant enregistré: ${args.voterAddress}`;
              } else if (eventType.name === 'ProposalRegistered') {
                const args = log.args as ProposalRegisteredArgs;
                formattedArgs = `Proposition enregistrée: #${Number(args.proposalId)}`;
              } else if (eventType.name === 'Voted') {
                const args = log.args as VotedArgs;
                formattedArgs = `Vote de ${args.voter} pour la proposition #${Number(args.proposalId)}`;
              } else if (eventType.name === 'WorkflowStatusChange') {
                const args = log.args as WorkflowStatusChangeArgs;
                const previousStatus = getWorkflowStatusName(Number(args.previousStatus));
                const newStatus = getWorkflowStatusName(Number(args.newStatus));
                formattedArgs = `Changement de statut: ${previousStatus} -> ${newStatus}`;
              }

              allEvents.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                eventName: eventType.name,
                blockNumber: Number(log.blockNumber),
                timestamp: Number(block.timestamp),
                transactionHash: log.transactionHash,
                args: log.args,
                formattedArgs
              });
            } catch (error) {
              console.error(`Erreur lors de la récupération des détails pour le log ${log.transactionHash}:`, error);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des événements ${eventType.name}:`, error);
        }
      }
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);

      setVotingEvents(allEvents);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Erreur lors du rafraîchissement des événements:", error);
    }
  }, [contractAddress, publicClient]);


  useWatchContractEvent({
    address: contractAddress,
    abi: VotingABI.abi,
    eventName: 'VoterRegistered',
    onLogs: async (logs) => {
      // Vérifiez si ces logs sont nouveaux
      const newLogs = logs.filter(log =>
        !processedEvents.has(`${log.transactionHash}-${log.logIndex}`)
      );

      if (newLogs.length > 0) {
        console.log("Nouveaux événements VoterRegistered détectés!", newLogs);

        // Marquer ces logs comme traités
        const updatedProcessedEvents = new Set(processedEvents);
        newLogs.forEach(log =>
          updatedProcessedEvents.add(`${log.transactionHash}-${log.logIndex}`)
        );
        setProcessedEvents(updatedProcessedEvents);

        // Mise à jour des données
        refreshEventsOnly();
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: VotingABI.abi,
    eventName: 'ProposalRegistered',
    onLogs: async (logs) => {
      // Vérifiez si ces logs sont nouveaux
      const newLogs = logs.filter(log =>
        !processedEvents.has(`${log.transactionHash}-${log.logIndex}`)
      );

      if (newLogs.length > 0) {
        console.log("Nouveaux événements ProposalRegistered détectés!", newLogs);

        // Marquer ces logs comme traités
        const updatedProcessedEvents = new Set(processedEvents);
        newLogs.forEach(log =>
          updatedProcessedEvents.add(`${log.transactionHash}-${log.logIndex}`)
        );
        setProcessedEvents(updatedProcessedEvents);

        // Mise à jour des données
        refreshEventsOnly();
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: VotingABI.abi,
    eventName: 'Voted',
    onLogs: async (logs) => {
      // Vérifiez si ces logs sont nouveaux
      const newLogs = logs.filter(log =>
        !processedEvents.has(`${log.transactionHash}-${log.logIndex}`)
      );

      if (newLogs.length > 0) {
        console.log("Nouveaux événements Voted détectés!", newLogs);

        // Marquer ces logs comme traités
        const updatedProcessedEvents = new Set(processedEvents);
        newLogs.forEach(log =>
          updatedProcessedEvents.add(`${log.transactionHash}-${log.logIndex}`)
        );
        setProcessedEvents(updatedProcessedEvents);

        // Mise à jour des données
        refreshEventsOnly();
      }
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: VotingABI.abi,
    eventName: 'WorkflowStatusChange',
    onLogs: async (logs) => {
      // Vérifiez si ces logs sont nouveaux
      const newLogs = logs.filter(log =>
        !processedEvents.has(`${log.transactionHash}-${log.logIndex}`)
      );

      if (newLogs.length > 0) {
        console.log("Nouveaux événements WorkflowStatusChange détectés!", newLogs);

        // Marquer ces logs comme traités
        const updatedProcessedEvents = new Set(processedEvents);
        newLogs.forEach(log =>
          updatedProcessedEvents.add(`${log.transactionHash}-${log.logIndex}`)
        );
        setProcessedEvents(updatedProcessedEvents);

        // Mise à jour des données
        refreshEventsOnly();
      }
    },
  });

  // Rafraîchir les données après une transaction confirmée
  useEffect(() => {
    if (isConfirmed) {
      // Rafraîchir le statut du workflow
      refetchWorkflowStatus();

      // Si nous sommes à l'étape finale, rafraîchir le gagnant
      if (workflowStatus === WorkflowStatus.VotesTallied) {
        refetchWinner();
      }
      // Rafraîchir les événements
      fetchEvents();




      if (isVoter) {
        // Rafraîchir les propositions
        fetchProposals();
        // Rafraîchir les informations du votant si nécessaire
        refetchVoterData();
      }
    }
  }, [isConfirmed, refetchWorkflowStatus, refetchWinner, workflowStatus, fetchEvents, fetchProposals, isVoter, refetchVoterData]);


  //////////////Gestion event



  const getWorkflowStatusName = (status: number): string => {
    switch (status) {
      case 0:
        return "Enregistrement des votants";
      case 1:
        return "Enregistrement des propositions démarré";
      case 2:
        return "Enregistrement des propositions terminé";
      case 3:
        return "Session de vote démarrée";
      case 4:
        return "Session de vote terminée";
      case 5:
        return "Votes comptabilisés";
      default:
        return `Statut inconnu (${status})`;
    }
  };




  useEffect(() => {
    fetchEvents();
  }, [contractAddress, publicClient]);



  useEffect(() => {
    if (isConfirmed) {
      // Toast de succès en fonction de la dernière action
      switch (lastAction) {
        case "tallyVotes":
          toast.success("Détermination de la proposition gagnante avec succès");
          break;
        case "registerVoter":
          toast.success("Votant ajouté avec succès");
          break;
        case "addProposal":
          toast.success("Proposition ajoutée avec succès");
          break;
        case "vote":
          toast.success("Vote validé avec succès");
          break;
        case "startProposalsRegistration":
          toast.success("Enregistrement des propositions démarré avec succès");
          break;
        case "endProposalsRegistration":
          toast.success("Enregistrement des propositions terminé avec succès");
          break;
        case "startVotingSession":
          toast.success("Session de vote démarrée avec succès");
          break;
        case "endVotingSession":
          toast.success("Session de vote terminée avec succès");
          break;
        default:
          console.log("Transaction confirmée avec succès");
      }

      // Réinitialiser l'action après affichage du toast
      setLastAction("");
    }

    if (isError || error) {
      // Toast d'erreur en fonction de la dernière action
      switch (lastAction) {
        case "tallyVotes":
          toast.error("Erreur lors de la détermination de la proposition gagnante");
          break;
        case "registerVoter":
          toast.error("Erreur lors de l'ajout d'un votant");
          break;
        case "addProposal":
          toast.error("Erreur lors de l'ajout d'une proposition");
          break;
        case "vote":
          toast.error("Erreur lors du vote");
          break;
        case "startProposalsRegistration":
          toast.error("Erreur lors du démarrage de l'enregistrement des propositions");
          break;
        case "endProposalsRegistration":
          toast.error("Erreur lors de la fin de l'enregistrement des propositions");
          break;
        case "startVotingSession":
          toast.error("Erreur lors du démarrage de la session de vote");
          break;
        case "endVotingSession":
          toast.error("Erreur lors de la fin de la session de vote");
          break;
        default:
          console.log(`Erreur lors de la transaction: ${error.message}`);
      }

      // Réinitialiser l'action après affichage du toast d'erreur
      setLastAction("");
    }
  }, [isConfirmed, isError, error, lastAction]);




  return {
    workflowStatus: workflowStatus as WorkflowStatus || WorkflowStatus.RegisteringVoters,
    winningProposalID: Number(winningProposalID || 0),
    proposals,
    proposalCount,
    voterInfo,
    isOwner,
    isVoter,
    loading,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    votingEvents,
    registerVoter,
    addProposal,
    vote,
    startProposalsRegistration,
    endProposalsRegistration,
    startVotingSession,
    endVotingSession,
    tallyVotes,
    checkVoterStatus, // Exposer cette fonction pour permettre au composant de vérifier manuellement
  };
};