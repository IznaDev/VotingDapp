// components/EventsHistory.tsx
import React from 'react';
import { VotingEvent } from '../hooks/useVotingContract';

type EventsHistoryProps = {
  events: VotingEvent[];
  loading: boolean;
};

export const EventsHistory: React.FC<EventsHistoryProps> = ({ events, loading }) => {
  // Fonction pour formater une date à partir d'un timestamp
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Fonction pour obtenir la classe CSS en fonction du type d'événement
  const getEventClass = (eventName: string): string => {
    switch (eventName) {
      case 'VoterRegistered':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'ProposalRegistered':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'Voted':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'WorkflowStatusChange':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Fonction pour obtenir l'icône en fonction du type d'événement
  const getEventIcon = (eventName: string): JSX.Element => {
    switch (eventName) {
      case 'VoterRegistered':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'ProposalRegistered':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Voted':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'WorkflowStatusChange':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Historique des événements</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Historique des événements</h2>
        <div className="text-center py-8 text-gray-500">
          Aucun événement trouvé pour ce contrat.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Historique des événements</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {events.map((event) => (
          <div 
            key={event.id}
            className={`p-4 rounded-lg border ${getEventClass(event.eventName)} flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getEventIcon(event.eventName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{event.eventName}</h3>
                <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
              </div>
              <p className="text-sm mt-1">{event.formattedArgs}</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline mt-2 inline-block"
              >
                Voir sur Etherscan
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};