import { useEffect, useState, useCallback } from 'react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import VotingABI from '../abis/Voting.json';

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
  const chainId = useChainId();

  type ContractAddresses = {
    [chainId: number]: `0x${string}`;
  };
  
  // Définir les adresses du contrat pour différentes chaînes
  const VOTING_CONTRACT_ADDRESSES: ContractAddresses = {
    1: '0x123456789abcdef...', // Ethereum Mainnet
    5: '0x987654321abcdef...', // Goerli Testnet
    11155111: '0x113339334422', // Sepolia Testnet
    31337: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  };

  const OWNER_ADDRESS: { [chainId: number]: `0x${string}` } = {
    1: '0xMainnetOwner...',
    5: '0xGoerliOwner...',
    11155111: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Sepolia
    31337: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb9226',
  };

  const contractAddress = chainId ? VOTING_CONTRACT_ADDRESSES[chainId] : undefined;
  
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

  // Fonction manuelle pour vérifier le statut de votant (n'est pas appelée automatiquement)
  const checkVoterStatus = useCallback(async () => {
    console.log("checkVoterStatus");
    if (!address || !isConnected || isOwner) return;
    
    try {
      // Créer une fonction pour lire les données du contrat sans utiliser useReadContract
      const readVoterData = async () => {
        try {
          // Cette partie doit être remplacée par votre propre logique pour appeler
          // le contrat directement sans utiliser un hook React
          return {
            isRegistered: true, // Remplacer par les vraies données
            hasVoted: false,    // Remplacer par les vraies données
            votedProposalId: 0  // Remplacer par les vraies données
          };
        } catch (error) {
          console.error("Erreur lors de la lecture des données du votant:", error);
          return null;
        }
      };
      
      const voterData = await readVoterData();
      
      if (voterData) {
        setVoterInfo(voterData);
        setIsVoter(voterData.isRegistered);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut de votant:", error);
    }
  }, [address, isConnected, isOwner]);


  useEffect(() => {
    // Si l'utilisateur est connecté, n'est pas un propriétaire, et le chargement est terminé
    if (isConnected && !isOwner && !loading) {
      checkVoterStatus();
    }
  }, [isConnected, isOwner, loading, checkVoterStatus]);


  // Fonctions pour interagir avec le contrat
  const registerVoter = useCallback((voterAddress: string) => {
    if (!isOwner) return;
    
    writeContract({
      address: contractAddress,
      abi: VotingABI.abi,
      functionName: 'addVoter',
      args: [voterAddress],
    });
  }, [isOwner, writeContract]);

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
    
    sasProposals.push({
      description: `Proposition ${nextindex}: ${description}`,
      voteCount: nextindex 
    });
    setProposals(sasProposals);
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