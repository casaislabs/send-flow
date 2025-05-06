import React, { useState, useEffect, useContext } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { BalancesContext } from '../context/BalancesContext';
import { toast } from 'sonner';

const SendEth = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { nativeBalance, tokenBalances, loading } = useContext(BalancesContext);

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('NATIVE'); 
  const [status, setStatus] = useState('');
  const [nativeCurrency, setNativeCurrency] = useState(''); 
  const [chainId, setChainId] = useState(null); 


  const [gasOption, setGasOption] = useState('medium');
  const [customGasPrice, setCustomGasPrice] = useState('');
  const [gasEstimates, setGasEstimates] = useState({ low: '', medium: '', fast: '' });
  const [estimatedGasLimit, setEstimatedGasLimit] = useState(null); 

  const nativeCurrencies = {
    1: 'ETH',
    56: 'BNB',
    137: 'MATIC',
    42161: 'ETH',
    10: 'ETH',
    11155111: 'ETH',
    97: 'BNB',
  };

  useEffect(() => {
    if (!walletClient) return;
    (async () => {
      const cid = walletClient.chain.id;
      setChainId(cid);
      setNativeCurrency(nativeCurrencies[cid] || 'NATIVE');
    })();
  }, [walletClient]);

  useEffect(() => {
    if (!walletClient) return;
    (async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient);
        const feeData = await provider.getFeeData();

        const baseGas = feeData.gasPrice;
        const maxPriorityFeePerGas =
          typeof feeData.maxPriorityFeePerGas === 'bigint'
            ? feeData.maxPriorityFeePerGas
            : 0n;

        if (baseGas) {
          setGasEstimates({
            low: ethers.formatUnits((baseGas * 90n) / 100n, 'gwei'),
            medium: ethers.formatUnits(baseGas, 'gwei'),
            fast: ethers.formatUnits((baseGas * 110n) / 100n + maxPriorityFeePerGas, 'gwei'),
          });
        } else {
          setGasEstimates({ low: 'N/A', medium: 'N/A', fast: 'N/A' });
        }
      } catch (error) {
        console.error('Error fetching gas estimates:', error);
      }
    })();
  }, [walletClient]);

  useEffect(() => {
    if (
      !walletClient ||
      !ethers.isAddress(to) ||
      !amount ||
      isNaN(amount) ||
      parseFloat(amount) <= 0
    ) {
      setEstimatedGasLimit('N/A');
      return;
    }

    (async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        let txParams;

        if (selectedToken === 'NATIVE') {
          txParams = { to, value: ethers.parseEther(amount.toString()) };
          const gasLimit = await signer.estimateGas(txParams);
          setEstimatedGasLimit(gasLimit.toString());
          return;
        } else {
          const token = tokenBalances.find((t) => t.symbol === selectedToken);
          if (!token) {
            setEstimatedGasLimit('N/A');
            return;
          }
          const erc20Abi = [
            'function transfer(address to, uint256 amount) public returns (bool)',
          ];
          const tokenContract = new ethers.Contract(token.address, erc20Abi, signer);
          const tokenAmount = ethers.parseUnits(
            amount.toString(),
            parseInt(token.decimals || 18, 10)
          );
          const gasLimit = await tokenContract.estimateGas.transfer(to, tokenAmount);
          setEstimatedGasLimit(gasLimit.toString());
          return;
        }
      } catch (error) {
        console.error('Error estimating gas limit:', error);
        setEstimatedGasLimit('N/A');
      }
    })();
  }, [walletClient, to, amount, selectedToken, tokenBalances]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setStatus('Please connect your wallet first.');
      toast.error('Please connect your wallet first.');
      return;
    }
    if (!ethers.isAddress(to)) {
      setStatus('Invalid recipient address.');
      toast.error('Invalid recipient address.');
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus('Invalid amount. Please enter a positive number.');
      toast.warning('Invalid amount. Please enter a positive number.');
      return;
    }
    try {
      if (!walletClient) {
        setStatus('Wallet client is not initialized. Please reconnect your wallet.');
        toast.error('Wallet client is not initialized. Please reconnect your wallet.');
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const gasPrice =
        gasOption === 'custom'
          ? ethers.parseUnits(customGasPrice, 'gwei')
          : ethers.parseUnits(gasEstimates[gasOption], 'gwei');

      if (selectedToken === 'NATIVE') {
        const value = ethers.parseEther(amount.toString());
        const tx = await signer.sendTransaction({ to, value, gasPrice });
        setStatus('Transaction sent! Waiting for confirmation...');
        toast.message('Transaction sent! Waiting for confirmation...', {
          description: `Hash: ${tx.hash}`,
        });
        await tx.wait();
        setStatus('Transaction confirmed!');
        toast.success('Transaction confirmed!');
      } else {
        const token = tokenBalances.find((t) => t.symbol === selectedToken);
        if (!token) {
          setStatus('Selected token not found in your balances.');
          toast.error('Selected token not found in your balances.');
          return;
        }
        const erc20Abi = ['function transfer(address to, uint256 amount) public returns (bool)'];
        const tokenContract = new ethers.Contract(token.address, erc20Abi, signer);
        const tokenAmount = ethers.parseUnits(
          amount.toString(),
          parseInt(token.decimals || 18, 10)
        );
        const tx = await tokenContract.transfer(to, tokenAmount, { gasPrice });
        setStatus('Transaction sent! Waiting for confirmation...');
        toast.message('Token transaction sent! Waiting for confirmation...', {
          description: `Hash: ${tx.hash}`,
        });
        await tx.wait();
        setStatus('Transaction confirmed!');
        toast.success('Token transaction confirmed!');
      }
    } catch (error) {
      console.error('Error details:', error);
      setStatus('Error sending transaction: ' + error.message);
    
      if (
        error.code === 4001 ||
        error.code === 'ACTION_REJECTED' ||
        (error.message && error.message.toLowerCase().includes('user rejected'))
      ) {
        toast.error('Transaction was rejected by the user.');
      } else {
        toast.error('Error sending transaction.', {
          description: error.message,
        });
      }
    }
  };

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-start bg-gray-100">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-2xl mx-auto mt-16 border-0 ring-4 ring-blue-400/40 ring-offset-2 ring-offset-purple-200 transition-all duration-300 hover:scale-[1.02] hover:ring-blue-500/70">
      <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center drop-shadow-lg">
          Send {nativeCurrency || 'Native Currency'} or Tokens
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading balances...</p>
        ) : selectedToken === 'NATIVE' && nativeBalance ? (
          <p className="text-center text-gray-700 mb-4 text-lg font-medium">
            <strong>Balance:</strong> {nativeBalance} {nativeCurrency}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4 text-lg font-medium">
            <strong>Balance:</strong>{' '}
            {tokenBalances.find((t) => t.symbol === selectedToken)?.balance || '0'}{' '}
            {selectedToken}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NATIVE">
                {nativeCurrency || 'Native Currency'} (Native) - {nativeBalance || '0'}
              </option>
              {tokenBalances.map((token, idx) => (
                <option key={idx} value={token.symbol}>
                  {token.name} ({token.symbol}) - {token.balance}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {(!to || !ethers.isAddress(to) || !amount || isNaN(amount) || parseFloat(amount) <= 0) ? (
            <p className="text-center text-red-500 font-semibold text-base">
              Please enter a valid address and amount.
            </p>
          ) : (
            <div className="relative">
              <label className="block text-gray-700 mb-2">Gas Price</label>
              <select
                value={gasOption}
                onChange={(e) => setGasOption(e.target.value)}
                className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">
                  Low ({gasEstimates.low || 'Calculating...'} Gwei, Gas Limit:{' '}
                  {estimatedGasLimit === null ? 'Calculating...' : estimatedGasLimit})
                </option>
                <option value="medium">
                  Medium ({gasEstimates.medium || 'Calculating...'} Gwei, Gas Limit:{' '}
                  {estimatedGasLimit === null ? 'Calculating...' : estimatedGasLimit})
                </option>
                <option value="fast">
                  Fast ({gasEstimates.fast || 'Calculating...'} Gwei, Gas Limit:{' '}
                  {estimatedGasLimit === null ? 'Calculating...' : estimatedGasLimit})
                </option>
                <option value="custom">Custom</option>
              </select>
              {gasOption === 'custom' && (
                <div className="relative mt-2">
                  <input
                    type="number"
                    placeholder="Custom Gas Price (Gwei)"
                    value={customGasPrice}
                    onChange={(e) => setCustomGasPrice(e.target.value)}
                    className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}


<button
  type="submit"
  className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-lg"
>
  Send
</button>

        </form>
        {status && <p className="mt-4 text-gray-700 text-center text-lg font-semibold">{status}</p>}
      </div>
    </div>
  );
};

export default SendEth;