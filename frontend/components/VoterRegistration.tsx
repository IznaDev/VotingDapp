// components/VoterRegistration.tsx
'use client';

import React, { useState } from 'react';
import { useVotingContract } from '../hooks/useVotingContract';
import { isAddress } from 'viem';

export const VoterRegistration = () => {
  const [voterAddress, setVoterAddress] = useState('');
  const [error, setError] = useState('');
  const { registerVoter, isPending, isConfirming } = useVotingContract();

  const isLoading = isPending || isConfirming;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!voterAddress) {
      setError('Veuillez entrer une adresse');
      return;
    }

    if (!isAddress(voterAddress)) {
      setError('Adresse Ethereum invalide');
      return;
    }

    try {
      registerVoter(voterAddress);
      setVoterAddress('');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'enregistrement du votant');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Enregistrer un votant</h2>
        <div className="h-1 bg-primary-500 w-16 rounded"></div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="voterAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse du votant
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="text"
              id="voterAddress"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              placeholder="0x..."
              className="input pl-10"
              disabled={isLoading}
            />
          </div>
          {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Enregistrer le votant
            </div>
          )}
        </button>
      </form>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">Information</h3>
        <p className="text-sm text-gray-600">Les votants enregistrés pourront soumettre des propositions et voter. Cette action n'est possible que pendant la phase d'enregistrement des votants.</p>
      </div>
    </div>
  );
};
