// components/ProposalList.tsx
import React from 'react';
import { useVotingContract, Proposal, WorkflowStatus } from '../hooks/useVotingContract';

type ProposalListProps = {
  onVote?: (id: number) => void;
  showVoteButton?: boolean;
  showResults?: boolean;
};

export const ProposalList = ({ onVote, showVoteButton = false, showResults = false }: ProposalListProps) => {
  const { proposals, workflowStatus, winningProposalID, voterInfo } = useVotingContract();

  if (!proposals || proposals.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center border border-dashed border-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-lg font-medium">Aucune proposition disponible</p>
        <p className="text-gray-400 text-sm mt-1">Les propositions s'afficheront ici une fois soumises</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border transition-all hover:shadow ${
            showResults && index === winningProposalID
              ? 'border-success-500 bg-success-50'
              : voterInfo?.votedProposalId === index
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {index === 0 && proposal.description === 'GENESIS'
                    ? 'Proposition GENESIS'
                    : `Proposition #${index}`}
                </span>

                {voterInfo?.votedProposalId === index && (
                  <span className="badge bg-primary-100 text-primary-800 border-primary-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Votre vote
                  </span>
                )}

                {showResults && index === winningProposalID && (
                  <span className="badge bg-success-100 text-success-800 border-success-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Gagnant
                  </span>
                )}
              </div>
              <p className="text-gray-700 mt-1">{proposal.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {showResults && (
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{proposal.voteCount}</div>
                  <div className="text-xs text-gray-500">vote{proposal.voteCount !== 1 ? 's' : ''}</div>
                </div>
              )}
              
              {showVoteButton && !voterInfo?.hasVoted && (
                <button
                  onClick={() => onVote && onVote(index)}
                  className="btn btn-secondary text-sm h-9"
                  disabled={workflowStatus !== WorkflowStatus.VotingSessionStarted}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Voter
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};