import React from 'react';
import { useAccount, useBalance } from 'wagmi';

const WalletInfo = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return null; // No mostrar nada si no hay una billetera conectada
  }

  return (
    <div className="absolute top-4 left-4 p-2 bg-gray-100 rounded-md shadow-sm">
      <p className="text-sm text-gray-700">
        <strong>Balance:</strong> {balance?.formatted || '0'} ETH
      </p>
    </div>
  );
};

export default WalletInfo;