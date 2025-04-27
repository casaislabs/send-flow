import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnector = () => {
  const [status, setStatus] = useState('');

  const handleConnecting = () => {
    setStatus('Conectando a MetaMask...');
  };

  const handleConnected = () => {
    setStatus('¡Conexión exitosa!');
  };

  return (
    <div className="flex items-center space-x-4">
      <ConnectButton
        accountStatus="address"
        chainStatus="icon"
        showBalance={false}
        onConnecting={handleConnecting}
        onConnected={handleConnected}
      />
      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </div>
  );
};

export default WalletConnector;