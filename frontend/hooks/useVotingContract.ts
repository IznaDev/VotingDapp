import { useEffect, useState, useCallback } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi';
import VotingABI from '../abis/Voting.json';
import toast, { Toaster } from "react-hot-toast";

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
  const publicClient = usePublicClient();
  type ContractAddresses = {
    [chainId: number]: `0x${string}`;
  };
  
  // Définir les adresses du contrat pour différentes chaînes
  const VOTING_CONTRACT_ADDRESSES: ContractAddresses = {
    11155111: '0x113339334422', // Sepolia Testnet
    31337: '0x5fbdb2315678afecb367f032d93f642f64180aa3',// hardhat
  };
  
  const OWNER_ADDRESS: { [chainId: number]: `0x${string}` } = {
    11155111: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Sepolia
    31337: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',// hardhat
  };

  const FROM_BLOCK: { [chainId: number]: number } = {
    11155111: 0, // Sepolia
    31337: 0,// hardhat
  };

  const contractAddress = chainId ? VOTING_CONTRACT_ADDRESSES[chainId] : undefined;
  const numberFromBlock = chainId ? FROM_BLOCK[chainId] : 0;
  
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
      enabled: !!contractAddress && isVoter,
    }
  });

  const { data: getVoterData, refetch: refetchVoterData, isLoading: isLoadingVoterData, isError: isErrorVoterData, error: voterDataError } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VotingABI.abi,
    functionName: 'getVoter',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!contractAddress && isConnected ,
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

      if(result.result && isEnabled){
        console.log(`Récupération de la proposition ${proposalId}:`, result.result);
        
        return {
          description: (result.result as Proposal).description,
          voteCount: Number((result.result as Proposal).voteCount)
        };
      }else{
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
        console.log("Données Genesis depuis le hook:", genesisProposalData);
        const genesis = {
          description: (genesisProposalData as Proposal).description ,
          voteCount: Number((genesisProposalData as Proposal).voteCount)
        };
        
        if (genesis.description !== "GENESIS") {
          console.log("Proposition Genesis invalide:", genesis);
          // Tenter de la récupérer manuellement
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
            console.log(`Tentative de récupération de la proposition ${index}`);
            const proposal = await getProposalById(index);
            if (proposal && proposal.description) {
              console.log(`Proposition ${index} récupérée:`, proposal);
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
        // Tenter de récupérer manuellement Genesis
        const genesis = await getProposalById(0);
        if (genesis && genesis.description === "GENESIS") {
          console.log("Genesis récupéré manuellement:", genesis);
          setProposals([genesis]);
          setProposalCount(1);
          // Pas besoin de récupérer les autres propositions maintenant,
          // l'effet se déclenchera à nouveau quand genesisProposalData sera disponible
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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
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
    if (isConnected && contractAddress) {
      fetchProposals();
    }
  }, [isConnected, contractAddress, fetchProposals]);


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
    try {
      writeContract({
        address: contractAddress,
        abi: VotingABI.abi,
        functionName: 'addVoter',
        args: [voterAddress],
      });
      toast.success("Voter ajouté avec success");
    }catch (err: any) {
      console.log("addVoter : "+err)
      toast.error("Une erreur est arrivé lors de l'ajout d'un voter", {
        duration: 5000,
        style: {
          wordBreak: "break-word",
        },
      });
    }
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
          fromBlock: BigInt(numberFromBlock),
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
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'addProposal',
      args: [description],
    });
    let sasProposals: Proposal[] = proposals;
    let nextindex: number = proposals.length+1;
    
    setProposals(prevProposals => [
      ...prevProposals,
      {
        description: `Proposition ${nextindex}: ${description}`,
        voteCount: 0
      }
    ]);
    setProposalCount(nextindex);

  }, [isVoter, writeContract]);

  const vote = useCallback((proposalId: number) => {
    if (!isVoter) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'setVote',
      args: [BigInt(proposalId)],
    });
  }, [isVoter, writeContract]);

  // Fonctions d'administration
  const startProposalsRegistration = useCallback(() => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'startProposalsRegistering',
    });
  }, [isOwner, writeContract]);

  const endProposalsRegistration = useCallback(() => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'endProposalsRegistering',
    });
  }, [isOwner, writeContract]);

  const startVotingSession = useCallback(() => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'startVotingSession',
    });
  }, [isOwner, writeContract]);

  const endVotingSession = useCallback(() => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'endVotingSession',
    });
  }, [isOwner, writeContract]);

  const tallyVotes = useCallback(() => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'tallyVotes',
    });
  }, [isOwner, writeContract]);

  // Rafraîchir les données après une transaction confirmée
  useEffect(() => {
    if (isConfirmed) {
      // Rafraîchir le statut du workflow
      refetchWorkflowStatus();
      
      // Si nous sommes à l'étape finale, rafraîchir le gagnant
      if (workflowStatus === WorkflowStatus.VotesTallied) {
        refetchWinner();
      }
      
    }
  }, [isConfirmed, refetchWorkflowStatus, refetchWinner, workflowStatus]);

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