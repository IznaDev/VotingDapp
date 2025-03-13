// components/StatusBadge.tsx
import React from 'react';
import { WorkflowStatus } from '../hooks/useVotingContract';

type StatusBadgeProps = {
  status: WorkflowStatus | undefined;
};

const getStatusLabel = (status: WorkflowStatus | undefined): string => {
  switch (status) {
    case WorkflowStatus.RegisteringVoters:
      return 'Enregistrement des votants';
    case WorkflowStatus.ProposalsRegistrationStarted:
      return 'Enregistrement des propositions';
    case WorkflowStatus.ProposalsRegistrationEnded:
      return 'Fin des propositions';
    case WorkflowStatus.VotingSessionStarted:
      return 'Session de vote ouverte';
    case WorkflowStatus.VotingSessionEnded:
      return 'Session de vote terminée';
    case WorkflowStatus.VotesTallied:
      return 'Votes comptabilisés';
    default:
      return 'Statut inconnu';
  }
};

const getStatusColor = (status: WorkflowStatus | undefined): string => {
  switch (status) {
    case WorkflowStatus.RegisteringVoters:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case WorkflowStatus.ProposalsRegistrationStarted:
      return 'bg-green-100 text-green-800 border-green-200';
    case WorkflowStatus.ProposalsRegistrationEnded:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case WorkflowStatus.VotingSessionStarted:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case WorkflowStatus.VotingSessionEnded:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case WorkflowStatus.VotesTallied:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: WorkflowStatus | undefined): JSX.Element => {
  switch (status) {
    case WorkflowStatus.RegisteringVoters:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case WorkflowStatus.ProposalsRegistrationStarted:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case WorkflowStatus.ProposalsRegistrationEnded:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case WorkflowStatus.VotingSessionStarted:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case WorkflowStatus.VotingSessionEnded:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case WorkflowStatus.VotesTallied:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {getStatusLabel(status)}
    </div>
  );
};