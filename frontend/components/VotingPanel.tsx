// components/VotingPanel.tsx
'use client';

import React, { useState } from 'react';
import { useVotingContract, WorkflowStatus } from '../hooks/useVotingContract';
import { ProposalList } from './ProposalList';

export const VotingPanel = () => {
  const [proposalText, setProposalText] = useState('');
  const {
    workflowStatus,
    addProposal,
    vote,
    voterInfo,
    isPending,
    isConfirming,
    winningProposalID,
    proposals
  } = useVotingContract();

  const isLoading = isPending || isConfirming;

  const handleAddProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalText.trim()) return;
    
    try {
      addProposal(proposalText);
      setProposalText('');
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la proposition:', err);
    }
  };

  const handleVote = (proposalId: number) => {
    try {
      vote(proposalId);
    } catch (err) {
      console.error('Erreur lors du vote:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section d'ajout de proposition */}
      {workflowStatus === WorkflowStatus.ProposalsRegistrationStarted && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Soumettre une proposition</h2>
            <div className="h-1 bg-primary-500 w-16 rounded"></div>
          </div>
          
          <form onSubmit={handleAddProposal} className="space-y-4">
            <div>
              <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-1">
                Description de la proposition
              </label>
              <textarea
                id="proposal"
                rows={3}
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Décrivez votre proposition de manière claire et concise..."
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!proposalText.trim() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  En cours...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Soumettre la proposition
                </div>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Affichage des propositions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {workflowStatus === WorkflowStatus.VotingSessionStarted && !voterInfo?.hasVoted
              ? 'Voter pour une proposition'
              : workflowStatus === WorkflowStatus.VotesTallied
                ? 'Résultats du vote'
                : 'Liste des propositions'}
          </h2>
          <div className="h-1 bg-primary-500 w-16 rounded"></div>
        </div>
        
        <ProposalList 
          onVote={handleVote} 
          showVoteButton={workflowStatus === WorkflowStatus.VotingSessionStarted} 
          showResults={workflowStatus === WorkflowStatus.VotesTallied}
        />

        {voterInfo?.hasVoted && workflowStatus !== WorkflowStatus.VotesTallied && (
          <div className="flex items-center p-4 bg-primary-50 text-primary-700 rounded-lg border border-primary-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Vous avez déjà voté pour la proposition #{voterInfo.votedProposalId}. Attendez la fin du vote pour voir les résultats.</span>
          </div>
        )}
        
        {workflowStatus < WorkflowStatus.VotingSessionStarted && (
          <div className="flex items-center p-4 bg-warning-50 text-warning-700 rounded-lg border border-warning-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>La session de vote n'a pas encore commencé. Vous pourrez voter lorsque l'administrateur ouvrira la session.</span>
          </div>
        )}
        
        {workflowStatus === WorkflowStatus.VotingSessionEnded && (
          <div className="flex items-center p-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>La session de vote est terminée. Attendez que l'administrateur comptabilise les votes pour voir les résultats.</span>
          </div>
        )}

        {workflowStatus === WorkflowStatus.VotesTallied && proposals.length > 0 && (
          <div className="bg-success-50 p-6 rounded-lg border border-success-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vote terminé !</h3>
            <p className="text-gray-600 mb-4">
              La proposition "{proposals[winningProposalID]?.description}" a remporté le vote avec {proposals[winningProposalID]?.voteCount} voix.
            </p>
            <div className="inline-flex items-center text-success-700 text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Processus de vote complété avec succès
            </div>
          </div>
        )}
      </div>
    </div>
  );
};