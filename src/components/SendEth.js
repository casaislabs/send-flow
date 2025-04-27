import React, { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

const SendEth = () => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

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

    // Debugging: Log the amount
    console.log('Amount entered:', amount);

    try {
      // Convert amount to wei
      const value = ethers.parseEther(amount.toString());
      console.log('Value in wei:', value); // Debugging: Log the converted value

      // Log walletClient for debugging
      console.log('Wallet Client:', walletClient);

      // Ensure walletClient is initialized
      if (!walletClient) {
        setStatus('Wallet client is not initialized. Please reconnect your wallet.');
        return;
      }

      // Get the signer from the walletClient
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      console.log('Signer:', signer);

      // Send the transaction using ethers
      const tx = await signer.sendTransaction({
        to,
        value,
      });

      // Debugging: Log the transaction response
      console.log('Transaction response:', tx);

      setStatus('Transaction sent! Waiting for confirmation...');
      await tx.wait(); // Wait for the transaction to be mined
      setStatus('Transaction confirmed!');
    } catch (error) {
      console.error('Error details:', error);
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