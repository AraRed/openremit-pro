import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { getUSDCAddress, ERC20_ABI } from '@/lib/contracts'

/**
 * Hook to check USDC balance for a wallet address on a specific chain
 *
 * @param chainId - The chain ID to check balance on
 * @param address - The wallet address to check balance for
 * @returns Balance info: formatted balance, raw balance, loading state, and refetch function
 */
export function useTokenBalance(chainId?: number, address?: `0x${string}`) {
  const usdcAddress = chainId ? getUSDCAddress(chainId) : undefined

  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!usdcAddress && !!address && !!chainId,
    },
  })

  return {
    // Human-readable balance (e.g., "500.00")
    balance: balance ? formatUnits(balance as bigint, 6) : '0',
    // Raw balance in wei for calculations
    balanceWei: (balance as bigint) || BigInt(0),
    // Loading state
    isLoading,
    // Function to manually refresh balance
    refetch,
  }
}
