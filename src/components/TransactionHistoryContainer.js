import React, { useContext, useState, useEffect } from 'react';
import { BalancesContext } from '../context/BalancesContext';
import { useAccount, useWalletClient } from 'wagmi';
import { format } from 'date-fns';
import axios from 'axios';
import { ethers } from 'ethers';

const TransactionHistoryContainer = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { nativeCurrency } = useContext(BalancesContext);

  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [explorerBaseUrl, setExplorerBaseUrl] = useState('');

  useEffect(() => {
    if (!address) {
      console.log('No address available for fetching transactions.');
      return;
    }
  
    if (!walletClient || !walletClient.chain) {
      console.error('Wallet client or chain information is missing.');
      return;
    }

    const chainId = walletClient.chain.id;
    const explorerUrls = {
      1: 'https://etherscan.io/tx/',
      56: 'https://bscscan.com/tx/',
      137: 'https://polygonscan.com/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      11155111: 'https://sepolia.etherscan.io/tx/',
    };
    setExplorerBaseUrl(explorerUrls[chainId] || '');

    const fetchTransactions = async () => {
      try {
        console.log('Current chainId:', chainId);

        const apiUrls = {
          1: 'https://api.etherscan.io/api',
          56: 'https://api.bscscan.com/api',
          137: 'https://api.polygonscan.com/api',
          42161: 'https://api.arbiscan.io/api',
          10: 'https://api-optimistic.etherscan.io/api',
          11155111: 'https://api-sepolia.etherscan.io/api',
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
    <div className="relative w-full max-w-5xl mx-auto mt-10">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur opacity-60 animate-pulse pointer-events-none"></div>
      <div className="relative bg-white/90 p-8 rounded-3xl shadow-2xl w-full border-4 border-transparent hover:border-blue-400 transition-all duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-9 h-9 text-blue-500 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-lg">
              Your Recent Transactions
            </h3>
          </div>
          <p className="text-base text-gray-600 font-medium text-center">
            Here you can review your latest activity, check status, and export your transaction history.
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-200 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('incoming')}
            className={`px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-200 ${
              filter === 'incoming'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Incoming
          </button>
          <button
            onClick={() => setFilter('outgoing')}
            className={`px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-200 ${
              filter === 'outgoing'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
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
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Export to CSV
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <ul className="flex flex-col space-y-4">
            {searchedTransactions.slice(0, visibleTransactions).map((tx, index) => (
              <li
                key={index}
                className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-2xl transition-shadow relative"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full shadow-md
                      ${tx.isError === '0' ? 'bg-gradient-to-br from-blue-400 to-purple-400' : 'bg-gradient-to-br from-red-400 to-pink-400'}`}>
                      {tx.isError === '0' ? (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                      <span className="font-mono">From:</span>
                      <span className="truncate max-w-[180px]">{tx.from || 'N/A'}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                      <span className="font-mono">To:</span>
                      <span className="truncate max-w-[180px]">{tx.to || 'N/A'}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                        ${tx.isError === '0' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.isError === '0' ? 'Success' : 'Failed'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tx.timeStamp ? format(new Date(tx.timeStamp * 1000), 'PPpp') : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 break-all">
                      <span className="font-mono">Hash:</span> {tx.hash}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className="text-lg font-bold text-blue-700">
                    {tx.value ? ethers.formatEther(tx.value) : '0'} {nativeCurrency || 'NATIVE'}
                  </span>
                  <span className="text-xs text-gray-600">
                  Gas Used: {tx.gasUsed || 'N/A'} / Gas Limit: {tx.gas || 'N/A'}
                  </span>
                  {explorerBaseUrl && (
                    <a
                      href={`${explorerBaseUrl}${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-lg shadow hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      See on Explorer
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {visibleTransactions < searchedTransactions.length && (
          <button
            onClick={() => setVisibleTransactions((prev) => prev + 5)}
            className="mt-6 w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Show More
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryContainer;