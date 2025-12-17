import { useEffect, useState } from 'react'
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { getUSDCAddress, ERC20_ABI } from '@/lib/contracts'

export interface ChainBalance {
  chainId: number
  chainName: string
  balance: string // Formatted (e.g., "500.00")
  balanceWei: bigint // Raw wei value
  isLoading: boolean
}

/**
 * Hook to check USDC balance across all supported chains
 *
 * @param address - Wallet address to check balances for
 * @returns Object with balances for each chain and auto-selected chain
 */
export function useMultiChainBalance(address: string | undefined) {
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([])
  const [autoSelectedChainId, setAutoSelectedChainId] = useState<number | null>(null)

  // Get all EVM chains (exclude TON since it's not EVM)
  const evmChains = [
    { chainId: 1, shortName: 'Ethereum' },
    { chainId: 8453, shortName: 'Base' },
    { chainId: 42161, shortName: 'Arbitrum' },
    { chainId: 10, shortName: 'Optimism' },
  ]

  // Build contract calls for all chains
  const contracts = address
    ? evmChains.map(chain => {
        const usdcAddress = getUSDCAddress(chain.chainId)
        return {
          address: usdcAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
          chainId: chain.chainId,
        }
      })
    : []

  // Fetch balances from all chains in parallel
  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  })

  // Process results and auto-select chain with highest balance
  useEffect(() => {
    if (!data || isLoading || !address) {
      setChainBalances([])
      setAutoSelectedChainId(null)
      return
    }

    const balances: ChainBalance[] = evmChains.map((chain, index) => {
      const result = data[index]
      const balanceWei = result?.status === 'success' ? (result.result as bigint) : BigInt(0)
      const balance = formatUnits(balanceWei, 6) // USDC has 6 decimals

      return {
        chainId: chain.chainId,
        chainName: chain.shortName,
        balance: parseFloat(balance).toFixed(2),
        balanceWei,
        isLoading: false,
      }
    })

    setChainBalances(balances)

    // Auto-select chain with highest balance (excluding Ethereum mainnet due to high gas)
    const l2Balances = balances.filter(b => b.chainId !== 1) // Exclude Ethereum mainnet

    if (l2Balances.length > 0) {
      const highestBalance = l2Balances.reduce((max, current) =>
        current.balanceWei > max.balanceWei ? current : max
      )

      // Only auto-select if there's a non-zero balance
      if (highestBalance.balanceWei > BigInt(0)) {
        setAutoSelectedChainId(highestBalance.chainId)
      } else {
        // Fallback to Base if no balance anywhere
        setAutoSelectedChainId(8453) // Base
      }
    } else {
      // Fallback to Base if no L2 balances found
      setAutoSelectedChainId(8453) // Base
    }
  }, [data, isLoading, address])

  return {
    chainBalances,
    autoSelectedChainId,
    isLoading,
  }
}
