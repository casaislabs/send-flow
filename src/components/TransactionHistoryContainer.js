import React, { useContext, useState, useEffect } from 'react';
import { BalancesContext } from '../context/BalancesContext';
import { useAccount, useWalletClient } from 'wagmi';
import { format } from 'date-fns';
import axios from 'axios';
import { ethers } from 'ethers';

const TransactionHistoryContainer = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient(); // Initialize walletClient
  const { nativeCurrency } = useContext(BalancesContext);

  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [visibleTransactions, setVisibleTransactions] = useState(5);

  useEffect(() => {
    if (!address) {
      console.log('No address available for fetching transactions.');
      return;
    }
  
    if (!walletClient || !walletClient.chain) {
      console.error('Wallet client or chain information is missing.');
      return;
    }
  
    const fetchTransactions = async () => {
      try {
        const chainId = walletClient.chain.id;
        console.log('Current chainId:', chainId);
  
        const apiUrls = {
          1: 'https://api.etherscan.io/api', // Ethereum Mainnet
          56: 'https://api.bscscan.com/api', // Binance Smart Chain
          137: 'https://api.polygonscan.com/api', // Polygon
          42161: 'https://api.arbiscan.io/api', // Arbitrum
          10: 'https://api-optimistic.etherscan.io/api', // Optimism
          11155111: 'https://api-sepolia.etherscan.io/api', // Sepolia Testnet
        };
  
        const apiUrl = apiUrls[chainId];
        if (!apiUrl) {
          console.error('Unsupported chainId:', chainId);
          return;
        }
  
        const response = await axios.get(apiUrl, {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            sort: 'desc',
            apikey: process.env.REACT_APP_ETHERSCAN_API_KEY,
          },
        });
  
        console.log('API Response:', response.data);
  
        if (response.data.status === '1') {
          console.log('Fetched transactions:', response.data.result);
          setTransactions(response.data.result);
        } else {
          console.log('No transactions found.');
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
  
    fetchTransactions();
  }, [address, walletClient]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'incoming') {
      return tx.to?.toLowerCase() === address?.toLowerCase();
    }
    if (filter === 'outgoing') {
      return tx.from?.toLowerCase() === address?.toLowerCase();
    }
    return true;
  });

  const searchedTransactions = filteredTransactions.filter(
    (tx) =>
      tx.to.toLowerCase().includes(search.toLowerCase()) ||
      tx.hash.toLowerCase().includes(search.toLowerCase())
  );

  console.log('Filtered transactions:', filteredTransactions);
  console.log('Searched transactions:', searchedTransactions);

  const exportToCSV = () => {
    const csvContent = [
      ['Hash', 'To', 'Value', 'Status', 'Gas Used', 'Date'],
      ...transactions.map((tx) => [
        tx.hash,
        tx.to,
        tx.value,
        tx.status,
        tx.gasUsed,
        format(new Date(tx.timeStamp * 1000), 'PPpp'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transaction_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl mx-auto mt-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Transaction History
      </h3>

      <div className="flex justify-center space-x-4 mb-4">
        <button onClick={() => setFilter('all')} className="p-2 bg-gray-200 rounded">
          All
        </button>
        <button onClick={() => setFilter('incoming')} className="p-2 bg-gray-200 rounded">
          Incoming
        </button>
        <button onClick={() => setFilter('outgoing')} className="p-2 bg-gray-200 rounded">
          Outgoing
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by address or hash"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4 text-right">
        <button onClick={exportToCSV} className="p-2 bg-blue-500 text-white rounded">
          Export to CSV
        </button>
      </div>
      <ul className="flex flex-col space-y-4">
  {searchedTransactions.slice(0, visibleTransactions).map((tx, index) => (
    <li
      key={index}
      className="p-4 border rounded-md bg-gray-50 shadow-sm flex flex-col space-y-2 hover:shadow-lg transition-shadow"
    >
      <p className="text-sm text-gray-700">
        <strong>To:</strong> {tx.to || 'N/A'}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Value:</strong> {tx.value ? ethers.formatEther(tx.value) : '0'} {nativeCurrency || 'NATIVE'}
      </p>
      <p className="text-sm text-gray-500">
        <strong>Status:</strong> {tx.isError === '0' ? 'Success' : 'Failed'}
      </p>
      <p className="text-sm text-gray-500">
        <strong>Gas Used:</strong> {tx.gasUsed || 'N/A'}
      </p>
      <p className="text-sm text-gray-500">
        <strong>Date:</strong> {tx.timeStamp ? format(new Date(tx.timeStamp * 1000), 'PPpp') : 'N/A'}
      </p>
    </li>
  ))}
</ul> 

      {visibleTransactions < searchedTransactions.length && (
        <button
          onClick={() => setVisibleTransactions((prev) => prev + 5)}
          className="mt-6 w-full p-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Show More
        </button>
      )}
    </div>
  );
};

export default TransactionHistoryContainer;