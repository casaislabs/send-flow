import React from 'react';
import WalletConnector from './components/WalletConnector';
import WalletInfo from './components/WalletInfo';
import SendEth from './components/SendEth';
import TransactionHistoryContainer from './components/TransactionHistoryContainer';
import { BalancesProvider } from './context/BalancesContext';

const App = () => {
  return (
    <BalancesProvider>
<div className="App min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col overflow-auto">
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
    <WalletInfo />
    <div className="text-white font-bold text-lg">Send ETH App</div>
    <WalletConnector />
  </div>

  <div className="flex-grow flex flex-col items-center bg-gray-100 space-y-8">
  <SendEth />
  <TransactionHistoryContainer />
</div>
</div>
    </BalancesProvider>
  );
};

export default App;