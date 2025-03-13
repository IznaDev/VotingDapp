import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, goerli, polygon, hardhat } from 'wagmi/chains';
import { SUPPORTED_CHAINS } from './constants';

export const config = getDefaultConfig({
  appName: 'Voting DApp',
  projectId: '76bf8b3f0f63dbf2682c0b37a8f12c80', 
  chains: [polygon, hardhat, mainnet, sepolia, goerli],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [goerli.id]: http(),
    [polygon.id]: http(),
    [hardhat.id]: http(),
  },
});