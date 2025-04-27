import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Send ETH App',
    projectId: '206f787e5776780d0e0dbfc18c43f215', // Asegúrate de que este Project ID sea válido
    chains: [
      mainnet,
      polygon,
      optimism,
      arbitrum,
      base,
      sepolia,
      ...(process.env.REACT_APP_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
    ],
  });