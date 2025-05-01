import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';

const SendEth = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient(); // Para operaciones de escritura

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [transactions, setTransactions] = useState([]); // Estado para el historial
  const [visibleTransactions, setVisibleTransactions] = useState(5); // Número de transacciones visibles

  // Mapeo de cadenas y sus APIs
  const chainApis = {
    1: { name: 'Ethereum', apiUrl: 'https://api.etherscan.io/api', apiKey: process.env.REACT_APP_ETHERSCAN_API_KEY },
    56: { name: 'BSC', apiUrl: 'https://api.bscscan.com/api', apiKey: process.env.REACT_APP_BSCSCAN_API_KEY },
    137: { name: 'Polygon', apiUrl: 'https://api.polygonscan.com/api', apiKey: process.env.REACT_APP_POLYGONSCAN_API_KEY },
    42161: { name: 'Arbitrum', apiUrl: 'https://api.arbiscan.io/api', apiKey: process.env.REACT_APP_ARBISCAN_API_KEY },
    10: { name: 'Optimism', apiUrl: 'https://api-optimistic.etherscan.io/api', apiKey: process.env.REACT_APP_OPTIMISM_API_KEY },
    11155111: { name: 'Sepolia', apiUrl: 'https://api-sepolia.etherscan.io/api', apiKey: process.env.REACT_APP_SEPOLIA_API_KEY },
    97: { name: 'BSC Testnet', apiUrl: 'https://api-testnet.bscscan.com/api', apiKey: process.env.REACT_APP_BSCSCAN_TESTNET_API_KEY },
  };

  // Fetch transactions from the appropriate API
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address || !walletClient) return;

      try {
        const chainId = walletClient.chain.id; // Obtén el chainId actual
        const chainApi = chainApis[chainId];

        if (!chainApi) {
          console.error(`No API configured for chainId: ${chainId}`);
          return;
        }

        const { apiUrl, apiKey } = chainApi;
        const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

        const response = await axios.get(url);
        const { result } = response.data;

        if (result && Array.isArray(result)) {
          const formattedHistory = result.map((tx) => ({
            hash: tx.hash,
            to: tx.to,
            value: ethers.formatEther(tx.value),
            chainId,
          }));
          setTransactions(formattedHistory);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [address, walletClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setStatus('Please connect your wallet first.');
      return;
    }

    // Validate recipient address
    if (!ethers.isAddress(to)) {
      setStatus('Invalid recipient address.');
      return;
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus('Invalid amount. Please enter a positive number.');
      return;
    }

    try {
      // Convert amount to wei
      const value = ethers.parseEther(amount.toString());

      // Ensure walletClient is initialized
      if (!walletClient) {
        setStatus('Wallet client is not initialized. Please reconnect your wallet.');
        return;
      }

      // Crear un proveedor de ethers usando el cliente de wagmi
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      // Enviar la transacción
      const tx = await signer.sendTransaction({
        to,
        value,
      });

      setStatus('Transaction sent! Waiting for confirmation...');
      await tx.wait(); // Espera la confirmación
      setStatus('Transaction confirmed!');

      // Add the transaction to the history
      setTransactions((prev) => [
        ...prev,
        {
          hash: tx.hash,
          to,
          value: ethers.formatEther(value),
          chainId: walletClient.chain.id, // Usa el chainId actual
        },
      ]);
    } catch (error) {
      console.error('Error details:', error);
      setStatus('Error sending transaction: ' + error.message);
    }
  };

  // Helper function to truncate strings (e.g., hash or address)
  const truncate = (str) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  // Helper function to get the explorer URL based on the chain ID
  const getExplorerUrl = (chainId, hash) => {
    const explorers = {
      1: `https://etherscan.io/tx/${hash}`, // Ethereum Mainnet
      56: `https://bscscan.com/tx/${hash}`, // Binance Smart Chain
      137: `https://polygonscan.com/tx/${hash}`, // Polygon
      42161: `https://arbiscan.io/tx/${hash}`, // Arbitrum
      10: `https://optimistic.etherscan.io/tx/${hash}`, // Optimism
      11155111: `https://sepolia.etherscan.io/tx/${hash}`, // Sepolia Testnet
      97: `https://testnet.bscscan.com/tx/${hash}`, // BSC Testnet
    };
    return explorers[chainId] || '#'; // Default to '#' if chain ID is not recognized
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100">
      {/* Formulario de envío */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-auto mt-12 border-4 border-gradient-to-r from-blue-500 to-purple-500">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Send ETH</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Recipient Address"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:opacity-90 transition-opacity text-lg"
          >
            Send ETH
          </button>
        </form>
        {status && <p className="mt-4 text-gray-700 text-center">{status}</p>}
      </div>

      {/* Historial de transacciones */}
      {transactions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl mx-auto mt-12">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Transaction History</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transactions.slice(0, visibleTransactions).map((tx, index) => (
              <li
                key={index}
                className="p-4 border rounded-md bg-gray-50 shadow-sm flex flex-col space-y-2 hover:shadow-lg transition-shadow"
              >
                <p className="text-sm text-gray-700">
                  <strong>To:</strong> {truncate(tx.to)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Value:</strong> {tx.value} ETH
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Date:</strong> {new Date().toLocaleString()}
                </p>
                <button
                  onClick={() => window.open(getExplorerUrl(tx.chainId, tx.hash), '_blank')}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:opacity-90 transition-opacity text-sm"
                >
                  View on Explorer
                </button>
              </li>
            ))}
          </ul>
          {visibleTransactions < transactions.length && (
            <button
              onClick={() => setVisibleTransactions((prev) => prev + 5)}
              className="mt-6 w-full p-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Show More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SendEth;