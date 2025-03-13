'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '../components/ConnectButton';
import { AdminPanel } from '../components/AdminPanel';
import { VotingPanel } from '../components/VotingPanel';
import { StatusBadge } from '../components/StatusBadge';
import { VoterRegistration } from '../components/VoterRegistration';
import { useVotingContract, WorkflowStatus } from '../hooks/useVotingContract';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isOwner, isVoter, workflowStatus, loading } = useVotingContract();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-primary-700 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-primary-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Système de Vote
            </h1>
            <div className="flex items-center gap-4">
              <StatusBadge status={workflowStatus} />
              <ConnectButton />
            </div>
          </div>
        </header>

        {!isConnected ? (
          <div className="card text-center py-12 max-w-md mx-auto bg-white/80 backdrop-blur-sm">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-4 text-gray-800">Bienvenue sur l'application de vote</h2>
            <p className="mb-6 text-gray-600">Connectez votre portefeuille pour accéder à toutes les fonctionnalités</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {isOwner && (
              <div className="card animate-fade-in">
                <AdminPanel />
              </div>
            )}
            
            {isOwner && workflowStatus === WorkflowStatus.RegisteringVoters && (
              <div className="card animate-fade-in">
                <VoterRegistration />
              </div>
            )}

            {isVoter && (
              <div className="card animate-fade-in">
                <VotingPanel />
              </div>
            )}

            {!isVoter && !isOwner && (
              <div className="card text-center py-8 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-warning-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Vous n'êtes pas enregistré comme votant</h2>
                <p className="text-gray-600">Contactez l'administrateur pour obtenir l'accès au système de vote</p>
              </div>
            )}
          </div>
        )}
        
        <footer className="mt-20 text-center text-gray-500 text-sm">
          <p>Voting DApp &copy; {new Date().getFullYear()} - Construit avec Next.js, RainbowKit et Wagmi</p>
        </footer>
      </div>
    </main>
  );
}