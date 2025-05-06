import React, { useEffect, useState } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useAccount, usePublicClient } from 'wagmi';
import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'sonner';

const TokenBalances = ({ onTokensFetched }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!isConnected || !address) return;

      setLoading(true);
      try {
        const chainId = await publicClient.getChainId();

        // If the network is supported by Ankr
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

            setTokens(tokenDetails);
            onTokensFetched(tokenDetails);
            toast.success('Tokens loaded successfully.', {
              description: `Found ${tokenDetails.length} tokens.`,
            });
          } else {
            setTokens([]);
            onTokensFetched([]);
            toast.warning('No tokens found on this network.');
          }
          return;
        }

        const alchemyNetwork = alchemyNetworks[chainId];
        if (!alchemyNetwork) {
          console.error(`Network with chainId ${chainId} is not supported.`);
          setTokens([]);
          onTokensFetched([]);
          toast.error('Network not supported for token lookup.');
          return;
        }

        const alchemy = new Alchemy({
          apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
          network: alchemyNetwork,
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

        const filteredTokens = tokenDetails.filter((token) => token !== null);
        setTokens(filteredTokens);
        onTokensFetched(filteredTokens);
        toast.success('Tokens loaded successfully.', {
          description: `Found ${filteredTokens.length} tokens.`,
        });
      } catch (error) {
        console.error('Error fetching token balances:', error);
        setTokens([]);
        onTokensFetched([]);
        toast.error('Error loading tokens.', {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalances();
  }, [address, isConnected, publicClient, onTokensFetched]);

  if (!isConnected) {
    return <p className="text-center text-gray-500">Please connect your wallet to view token balances.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto mt-12">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Token Balances</h3>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          {tokens.length > 0 ? (
            <ul className="space-y-4">
              {tokens.map((token, index) => (
                <li key={index} className="p-4 border rounded-md bg-gray-50 shadow-sm">
                  <p className="text-sm text-gray-700">
                    <strong>Name:</strong> {token.name} ({token.symbol})
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Balance:</strong> {token.balance}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Contract:</strong> {token.address}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No tokens found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default TokenBalances;