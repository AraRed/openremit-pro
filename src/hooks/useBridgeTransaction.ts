import { useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { useStore } from '@/store/useStore'
import { getExecutionRoute } from '@/lib/lifi'
import { parseUnits } from 'viem'
import type { BridgeParams } from '@/lib/types'

/**
 * Hook to execute bridge transactions
 * Supports both Symbiosis and Li.Fi routes
 *
 * @returns Bridge execution functions and state
 */
export function useBridgeTransaction() {
  const setTransactionStatus = useStore((state) => state.setTransactionStatus)
  const setTransactionHash = useStore((state) => state.setTransactionHash)
  const setTransactionError = useStore((state) => state.setTransactionError)

  const { sendTransactionAsync, data: hash } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Update status when transaction is confirmed
  if (isSuccess && hash) {
    setTransactionStatus('success')
  }

  const executeBridge = async (params: BridgeParams) => {
    try {
      setTransactionStatus('executing')
      setTransactionError(null)

      // Auto-switch network if needed
      try {
        await switchChainAsync({ chainId: params.fromChainId })
      } catch (switchError) {
        // User might have rejected the switch, or they're already on the right network
        console.warn('Network switch failed or cancelled:', switchError)
      }

      // Check if this is a Symbiosis route (has rawSymbiosisData)
      // @ts-ignore - rawSymbiosisData is added to route but not in type definition
      const symbiosisData = params.route.rawSymbiosisData

      if (symbiosisData) {
        // Use Symbiosis transaction data directly
        console.log('🔷 Executing Symbiosis bridge transaction...', symbiosisData.tx)

        const txHash = await sendTransactionAsync({
          to: symbiosisData.tx.to as `0x${string}`,
          data: symbiosisData.tx.data as `0x${string}`,
          value: symbiosisData.tx.value ? BigInt(symbiosisData.tx.value) : BigInt(0),
          chainId: params.fromChainId,
        })

        setTransactionHash(txHash)
        setTransactionStatus('pending')

        return txHash
      } else {
        // Fallback to Li.Fi for non-Symbiosis routes
        console.log('🔷 Executing Li.Fi bridge transaction...')

        // Convert amount to wei (USDC has 6 decimals)
        const amountWei = parseUnits(params.amount, 6).toString()

        // Get execution route from Li.Fi SDK
        const route = await getExecutionRoute(
          params.fromChainId,
          params.toChainId,
          amountWei,
          params.fromAddress,
          params.toAddress // Pass recipient address (will default to fromAddress if undefined)
        )

        if (!route.steps || route.steps.length === 0) {
          throw new Error('No transaction steps found in route')
        }

        // Execute first step (Li.Fi SDK handles multi-step routes)
        const step = route.steps[0]
        if (!step) {
          throw new Error('No step found in route')
        }

        const txRequest = step.transactionRequest

        if (!txRequest) {
          throw new Error('No transaction request found in route step')
        }

        const txHash = await sendTransactionAsync({
          to: txRequest.to as `0x${string}`,
          data: txRequest.data as `0x${string}`,
          value: txRequest.value ? BigInt(txRequest.value) : undefined,
          chainId: params.fromChainId,
        })

        setTransactionHash(txHash)
        setTransactionStatus('pending')

        return txHash
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setTransactionError(errorMessage)
      setTransactionStatus('error')
      throw error
    }
  }

  return {
    executeBridge,
    isExecuting: isConfirming,
    transactionHash: hash,
    isSuccess,
  }
}
