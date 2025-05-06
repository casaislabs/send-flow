import React, { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

const WalletConnector = () => {
  const { isConnected } = useAccount();
  const [wasConnected, setWasConnected] = useState(false);

  const handleConnecting = () => {
    toast.info('Connecting to MetaMask...', {
      description: 'Please authorize the connection in your wallet.',
    });
  };

  useEffect(() => {
    if (isConnected && !wasConnected) {
      toast.success('Successfully connected!', {
        description: 'Your wallet is now connected.',
      });
      setWasConnected(true);
    }
    if (!isConnected && wasConnected) {
      setWasConnected(false);
    }
  }, [isConnected, wasConnected]);
  return (
    <div className="flex items-center space-x-4">
      <div className="rounded-xl shadow-xl bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-1 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={true}
          label="Connect Wallet"
          className="!bg-white !text-blue-700 !font-bold !rounded-lg !px-6 !py-3 !shadow-lg !transition-all !duration-300 hover:!bg-gradient-to-r hover:!from-blue-500 hover:!to-purple-600 hover:!text-white"
          onClick={handleConnecting}
        />
      </div>
    </div>
  );
};

export default WalletConnector;