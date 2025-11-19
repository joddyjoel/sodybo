// hooks/useMoralisBalances.ts
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export const useMoralisBalances = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { address, isConnected } = useAccount();

  const scanBalances = async (userAddress) => {
    setLoading(true);
    setError(null);
    
    try {
      const userBalances = await scanUserBalances(userAddress);
      setBalances(userBalances);
    } catch (err) {
      setError('Failed to scan balances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      scanBalances(address);
    } else {
      setBalances([]);
    }
  }, [address, isConnected]);

  const refreshBalances = () => {
    if (address) {
      scanBalances(address);
    }
  };

  return {
    balances,
    loading,
    error,
    refreshBalances,
    totalAssets: balances.length
  };
};