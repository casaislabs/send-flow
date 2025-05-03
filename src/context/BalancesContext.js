import React, { createContext, useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Alchemy, Network } from 'alchemy-sdk';
import axios from 'axios';
import { ethers } from 'ethers';

// Crear el contexto
export const BalancesContext = createContext();

// Configuración de redes soportadas
const alchemyNetworks = {
  1: Network.ETH_MAINNET,
  137: Network.MATIC_MAINNET,
  42161: Network.ARB_MAINNET,
  10: Network.OPT_MAINNET,
  11155111: Network.ETH_SEPOLIA,
};

const ankrChains = {
  56: 'bsc',
  97: 'bsc_testnet',
};

// Proveedor del contexto
export const BalancesProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [nativeBalance, setNativeBalance] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address) return;

      setLoading(true);
      try {
        const chainId = await publicClient.getChainId();

        // Obtener balance nativo
        const nativeBalanceInWei = await publicClient.getBalance({ address });
        const nativeBalanceInEth = parseFloat(ethers.formatEther(nativeBalanceInWei));
        setNativeBalance(nativeBalanceInEth.toFixed(6));

        // Obtener balances de tokens
        if (ankrChains[chainId]) {
          const chain = ankrChains[chainId];
          const response = await axios.post('https://rpc.ankr.com/multichain', {
            jsonrpc: '2.0',
            method: 'ankr_getAccountBalance',
            params: {
              blockchain: chain,
              walletAddress: address,
            },
            id: 1,
          });

          const result = response.data.result;
          if (result && result.assets) {
            const tokenDetails = result.assets
              .filter((asset) => parseFloat(asset.balance) > 0)
              .map((asset) => ({
                name: asset.tokenName,
                symbol: asset.tokenSymbol,
                balance: parseFloat(asset.balance).toFixed(6),
                address: asset.contractAddress,
              }));
            setTokenBalances(tokenDetails);
          } else {
            setTokenBalances([]);
          }
          return;
        }

        if (alchemyNetworks[chainId]) {
          const alchemy = new Alchemy({
            apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
            network: alchemyNetworks[chainId],
          });

          const response = await alchemy.core.getTokenBalances(address);
          const nonZeroTokens = response.tokenBalances.filter(
            (token) => token.tokenBalance !== '0'
          );

          const tokenDetails = await Promise.all(
            nonZeroTokens.map(async (token) => {
              const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
              const rawBalance = ethers.formatUnits(token.tokenBalance, metadata.decimals || 18);
              const balance = parseFloat(rawBalance);
              if (balance > 0) {
                return {
                  name: metadata.name,
                  symbol: metadata.symbol,
                  balance: balance.toFixed(6),
                  address: token.contractAddress,
                };
              }
              return null;
            })
          );

          setTokenBalances(tokenDetails.filter((token) => token !== null));
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
        setNativeBalance(null);
        setTokenBalances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [isConnected, address, publicClient]);

  return (
    <BalancesContext.Provider value={{ nativeBalance, tokenBalances, loading }}>
      {children}
    </BalancesContext.Provider>
  );
};