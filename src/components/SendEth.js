import React, { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

const SendEth = () => {
  const { address, isConnected } = useAccount(); // Información de la cuenta conectada
  const publicClient = usePublicClient(); // Proveedor público gestionado por wagmi
  const { data: walletClient } = useWalletClient(); // Cliente de la billetera gestionado por wagmi

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setStatus('Please connect your wallet first.');
      return;
    }

    // Validar la dirección del destinatario
    if (!ethers.isAddress(to)) {
      setStatus('Invalid recipient address.');
      return;
    }

    // Validar la cantidad de ETH
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus('Invalid amount. Please enter a positive number.');
      return;
    }

    try {
      // Convertir la cantidad a wei
      const value = ethers.parseEther(amount);

      // Crear un signer desde el cliente de la billetera
      const signer = walletClient.getSigner();

      // Enviar la transacción usando el signer
      const tx = await signer.sendTransaction({
        to,
        value,
      });

      setStatus('Transaction sent! Waiting for confirmation...');
      await tx.wait(); // Esperar a que se confirme la transacción
      setStatus('Transaction confirmed!');
    } catch (error) {
      console.error(error);
      setStatus('Error sending transaction: ' + error.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Send ETH</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Recipient Address"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="p-2 border rounded-md"
          required
        />
        <input
          type="number"
          placeholder="Amount in ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-2 border rounded-md"
          required
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Send ETH
        </button>
      </form>
      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </div>
  );
};

export default SendEth;