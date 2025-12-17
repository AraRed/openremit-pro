import { useBalance } from 'wagmi'
import { formatUnits } from 'viem'

/**
 * Hook to fetch native token balance (ETH, MATIC, etc.)
 *
 * @param chainId - The chain ID to check balance on
 * @param address - The wallet address to check
 * @returns Native token balance in human-readable and wei formats
 */
export function useNativeBalance(chainId?: number, address?: `0x${string}`) {
  const { data, isLoading, refetch } = useBalance({
    address,
    chainId,
    query: {
      enabled: !!address && !!chainId,
    },
  })

  return {
    balance: data ? formatUnits(data.value, data.decimals) : '0',
    balanceWei: data?.value || BigInt(0),
    symbol: data?.symbol || 'ETH',
    decimals: data?.decimals || 18,
    isLoading,
    refetch,
  }
}
