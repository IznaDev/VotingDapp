// components/AdminPanel.tsx
'use client';

import React, { useState } from 'react';
import { useVotingContract, WorkflowStatus } from '../hooks/useVotingContract';

export const AdminPanel = () => {
  const { 
    workflowStatus, 
    startProposalsRegistration, 
    endProposalsRegistration,
    startVotingSession,
    endVotingSession,
    tallyVotes,
    isPending,
    isConfirming
  } = useVotingContract();

  const isLoading = isPending || isConfirming;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Panneau d'administration</h2>
        <div className="h-1 bg-primary-500 w-16 rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {/* Ligne de progression */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 md:flex hidden"></div>
        <div 
          className="absolute top-5 left-0 h-1 bg-primary-500 transition-all duration-500 md:flex hidden" 
          style={{ width: `${(Number(workflowStatus) / 5) * 100}%` }}
        ></div>
        
        {/* Étapes du workflow */}
        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === WorkflowStatus.RegisteringVoters 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : Number(workflowStatus) !== WorkflowStatus.RegisteringVoters 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white border border-gray-200'
          }`}
          disabled={true} // Disabled car c'est l'état initial
          title="État initial"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Enregistrement Votants</span>
        </button>

        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === 1 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : Number(workflowStatus) > 1 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white border border-gray-200'
          }`}
          onClick={() => startProposalsRegistration()}
          disabled={workflowStatus !== 0 || isLoading}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Début Propositions</span>
        </button>

        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === 2 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : Number(workflowStatus) > 2 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white border border-gray-200'
          }`}
          onClick={() => endProposalsRegistration()}
          disabled={workflowStatus !== 1 || isLoading}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Fin Propositions</span>
        </button>

        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === 3 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : Number(workflowStatus) > 3 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white border border-gray-200'
          }`}
          onClick={() => startVotingSession()}
          disabled={workflowStatus !== 2 || isLoading}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Début Vote</span>
        </button>

        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === 4 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : Number(workflowStatus) > 4 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white border border-gray-200'
          }`}
          onClick={() => endVotingSession()}
          disabled={workflowStatus !== 3 || isLoading}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Fin Vote</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            workflowStatus === 5 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : 'bg-white border border-gray-200'
          }`}
          onClick={() => tallyVotes()}
          disabled={workflowStatus !== 4 || isLoading}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-primary-300 mb-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Comptabiliser</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center px-4 py-3 bg-primary-50 text-primary-700 rounded-lg animate-pulse">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Transaction en cours...</span>
        </div>
      )}
    </div>
  );
};