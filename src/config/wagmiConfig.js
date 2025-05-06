import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  bsc,
  bscTestnet,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Send ETH App',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    bsc,
    bscTestnet,
    sepolia,
    ...(process.env.REACT_APP_ENABLE_TESTNETS === 'true' ? [sepolia, bscTestnet] : []),
  ],
});