/**
 * TransactionScreen - Handle bridge transaction execution
 *
 * Flow:
 * 1. Pre-flight checks (network, balance)
 * 2. Approval (if needed)
 * 3. Execute bridge transaction
 * 4. Track status and link to explorer
 */

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { Button, Card } from '@/components/ui'
import { TransactionStatus } from '@/components/TransactionStatus'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useTokenApproval } from '@/hooks/useTokenApproval'
import { useBridgeTransaction } from '@/hooks/useBridgeTransaction'
import { useNativeBalance } from '@/hooks/useNativeBalance'
import { getExecutionRoute } from '@/lib/lifi'
import type { Route } from '@lifi/types'

// Chain names for display
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism',
  607: 'TON Network',
}

export function TransactionScreen() {
  const { address } = useAccount()
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const {
    selectedRoute,
    userInput,
    transactionStatus,
    transactionHash,
    transactionError,
    approvalHash,
    setCurrentScreen,
    setTransactionStatus,
    resetTransaction,
  } = useStore()

  const [spenderAddress, setSpenderAddress] = useState<string>('')
  const [lifiRoute, setLifiRoute] = useState<Route | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [quoteRefreshKey, setQuoteRefreshKey] = useState(0)

  // Get chain IDs from user input (no longer hardcoded!)
  const fromChainId = userInput?.fromChainId || 1 // Default to Ethereum if not set
  const toChainId = userInput?.toChainId || 8453 // Default to Base if not set
  const recipientAddress = userInput?.recipient // Optional recipient address

  // Get USDC balance
  const { balance, balanceWei, isLoading: isLoadingBalance } = useTokenBalance(
    fromChainId,
    address
  )

  // Get native token (ETH) balance for gas fees
  const { balance: ethBalance, balanceWei: ethBalanceWei, symbol: nativeSymbol, isLoading: isLoadingGas } = useNativeBalance(
    fromChainId,
    address
  )

  // Parse transfer amount
  const transferAmount = userInput?.amount || 0
  const transferAmountWei = parseUnits(transferAmount.toString(), 6)

  // Estimate gas needed (conservative estimate for approval + execution)
  // L2s are MUCH cheaper: ~$0.01-0.05 per tx vs ~$5-20 on mainnet
  const estimatedGasWei = fromChainId === 1
    ? parseUnits('0.005', 18) // Mainnet: ~$15 (covers gas spikes)
    : parseUnits('0.00005', 18) // L2s (Base, Arb, Op): ~$0.15 (5-10x buffer)
  const estimatedGasFormatted = fromChainId === 1 ? '0.005' : '0.00005'
  const hasEnoughGas = ethBalanceWei >= estimatedGasWei

  // Approval hook (we'll get spender from Li.Fi route)
  const {
    approve,
    isApproving,
    isApproved,
    needsApproval,
    refetchAllowance,
  } = useTokenApproval(fromChainId, spenderAddress || '0x0000000000000000000000000000000000000000', transferAmountWei)

  // Bridge transaction hook
  const { executeBridge, isExecuting } = useBridgeTransaction()

  // Check if user has sufficient balance
  const hasSufficientBalance = balanceWei >= transferAmountWei

  // Check if on correct network
  const isCorrectNetwork = currentChainId === fromChainId

  // Validate spender address
  const hasValidSpender = spenderAddress && spenderAddress !== '0x0000000000000000000000000000000000000000'

  // Pre-flight checks passed (either has Symbiosis data or Li.Fi route)
  // @ts-ignore
  const hasRouteData = selectedRoute?.rawSymbiosisData || lifiRoute !== null
  const preflightPassed = hasSufficientBalance && isCorrectNetwork && !isLoadingBalance && !isLoadingGas && hasRouteData && !isLoadingRoute && hasEnoughGas && hasValidSpender

  // Reset transaction state on mount (run once)
  useEffect(() => {
    resetTransaction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch route data (Symbiosis or Li.Fi) to get spender address
  useEffect(() => {
    const fetchRoute = async () => {
      if (!address || !userInput || !selectedRoute) return

      setIsLoadingRoute(true)
      setRouteError(null)

      try {
        // Check if this is a Symbiosis route
        // @ts-ignore - rawSymbiosisData is added to route but not in type definition
        const symbiosisData = selectedRoute.rawSymbiosisData

        if (symbiosisData) {
          // Use Symbiosis data directly - no need to fetch
          console.log('🔷 Using Symbiosis route data', symbiosisData)
          console.log('🔍 Symbiosis spender address (approveTo):', symbiosisData.approveTo)
          setLifiRoute(null) // Not a Li.Fi route
          setSpenderAddress(symbiosisData.approveTo) // Symbiosis approval address
        } else {
          // Fetch Li.Fi route for non-Symbiosis routes
          const amountWei = parseUnits(transferAmount.toString(), 6).toString()
          const route = await getExecutionRoute(
            fromChainId,
            toChainId,
            amountWei,
            address,
            recipientAddress // Pass recipient address
          )

          setLifiRoute(route)

          // Extract spender address from the first step
          if (route.steps && route.steps.length > 0) {
            const firstStep = route.steps[0]
            if (firstStep?.estimate?.approvalAddress) {
              setSpenderAddress(firstStep.estimate.approvalAddress)
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load route'
        setRouteError(errorMsg)
        console.error('Failed to fetch route:', error)
      } finally {
        setIsLoadingRoute(false)
      }
    }

    fetchRoute()
  }, [address, fromChainId, toChainId, transferAmount, userInput, recipientAddress, selectedRoute, quoteRefreshKey])

  // 🔥 NEW: Auto-refresh quotes every 30 seconds to prevent expiration
  useEffect(() => {
    // Only refresh if we're on the idle state (not during active transactions)
    if (transactionStatus !== 'idle') return

    const refreshInterval = setInterval(() => {
      console.log('⏰ Auto-refreshing quote to prevent expiration...')
      setQuoteRefreshKey((prev) => prev + 1)
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [transactionStatus])

  // 🔥 NEW: Smart network switching before approval with error recovery
  const handleApprove = async () => {
    // Step 1: Check and switch network if needed
    if (currentChainId !== fromChainId) {
      setIsSwitchingNetwork(true)
      try {
        console.log(`🔄 Switching to ${CHAIN_NAMES[fromChainId]} for approval`)
        await switchChainAsync({ chainId: fromChainId })
      } catch (error: any) {
        console.error('Network switch failed:', error)
        setIsSwitchingNetwork(false)

        // Handle user rejection
        if (error.code === 4001 || error.message?.includes('User rejected')) {
          console.log('👤 User cancelled network switch')
          return
        }

        // Show error for other failures
        setTransactionStatus('error')
        return
      }
      setIsSwitchingNetwork(false)
    }

    // Step 2: Execute approval and wait for confirmation
    try {
      const txHash = await approve()
      console.log('📝 Approval transaction sent:', txHash)
      // The useWaitForTransactionReceipt hook in useTokenApproval will track confirmation
      // Once isApproved becomes true, the UI will automatically update
    } catch (error: any) {
      console.error('Approval failed:', error)

      // Handle different error types
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        // User cancelled - reset to idle state
        console.log('👤 User cancelled approval')
        setTransactionStatus('idle')
      } else if (error.code === -32603) {
        // RPC error
        console.error('🔴 RPC error during approval')
        setTransactionStatus('error')
      } else {
        // Unknown error
        setTransactionStatus('error')
      }
    }
  }

  // 🔥 NEW: Smart network switching before execution with error recovery
  const handleExecute = async () => {
    if (!address || !selectedRoute) return

    // Step 1: Check and switch network if needed
    if (currentChainId !== fromChainId) {
      setIsSwitchingNetwork(true)
      try {
        console.log(`🔄 Switching to ${CHAIN_NAMES[fromChainId]} for execution`)
        await switchChainAsync({ chainId: fromChainId })
      } catch (error: any) {
        console.error('Network switch failed:', error)
        setIsSwitchingNetwork(false)

        // Handle user rejection
        if (error.code === 4001 || error.message?.includes('User rejected')) {
          console.log('👤 User cancelled network switch')
          return
        }

        // Show error for other failures
        setTransactionStatus('error')
        return
      }
      setIsSwitchingNetwork(false)
    }

    // Step 2: Execute bridge
    try {
      await executeBridge({
        route: selectedRoute,
        fromChainId,
        toChainId,
        amount: transferAmount.toString(),
        fromAddress: address,
        toAddress: recipientAddress || address, // 🔥 FIX: Use recipient if provided, otherwise self-send
      })
    } catch (error: any) {
      console.error('Bridge execution failed:', error)

      // Handle different error types
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        // User cancelled - reset to idle state
        console.log('👤 User cancelled execution')
        setTransactionStatus('idle')
      } else if (error.message?.includes('expired') || error.message?.includes('Request expired')) {
        // Quote expired - show specific error
        console.error('⏰ Quote expired')
        setTransactionStatus('error')
      } else if (error.code === -32603) {
        // RPC error
        console.error('🔴 RPC error during execution')
        setTransactionStatus('error')
      } else {
        // Unknown error - already handled by useBridgeTransaction
        setTransactionStatus('error')
      }
    }
  }

  // Reset to idle state (for Cancel button)
  const handleCancel = () => {
    resetTransaction()
  }

  // Handle back navigation
  const handleBack = () => {
    setCurrentScreen('routes')
    resetTransaction()
  }

  if (!selectedRoute || !userInput) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md bg-white p-6">
          <p className="text-center text-gray-700">No route selected</p>
          <Button onClick={() => setCurrentScreen('chat')} className="mt-4 w-full">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={handleBack} className="mb-4 text-sm text-blue-600 hover:text-blue-800">
            ← Back to Routes
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Execute Transfer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Send {transferAmount} USDC from {CHAIN_NAMES[fromChainId] || 'Unknown'} to {CHAIN_NAMES[toChainId] || 'TON Network'}
          </p>
        </div>

        {/* Pre-flight Checks */}
        <Card className="mb-6 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pre-flight Checks</h2>
          <div className="space-y-3">
            {/* Network Check */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Network</span>
              <span className={`text-sm font-medium ${isCorrectNetwork ? 'text-green-600' : 'text-yellow-600'}`}>
                {isCorrectNetwork ? '✅ ' + CHAIN_NAMES[fromChainId] : '⚠️ Switch to ' + CHAIN_NAMES[fromChainId]}
              </span>
            </div>

            {/* Balance Check */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Balance</span>
              <span className={`text-sm font-medium ${hasSufficientBalance ? 'text-green-600' : 'text-red-600'}`}>
                {isLoadingBalance ? '⏳ Loading...' : hasSufficientBalance ? `✅ ${balance} USDC` : `❌ Insufficient (${balance} USDC)`}
              </span>
            </div>

            {/* Route Check */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Route</span>
              <span className={`text-sm font-medium ${hasRouteData ? 'text-green-600' : isLoadingRoute ? 'text-yellow-600' : 'text-red-600'}`}>
                {isLoadingRoute ? '⏳ Loading...' : hasRouteData ? '✅ Ready' : routeError ? `❌ ${routeError}` : '❌ Failed'}
              </span>
            </div>

            {/* Gas Balance Check */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Gas ({nativeSymbol})</span>
              <span className={`text-sm font-medium ${hasEnoughGas ? 'text-green-600' : 'text-red-600'}`}>
                {isLoadingGas ? '⏳ Loading...' : hasEnoughGas ? `✅ ${parseFloat(ethBalance).toFixed(4)} ${nativeSymbol}` : `❌ Need ~${estimatedGasFormatted} ${nativeSymbol}`}
              </span>
            </div>
          </div>
        </Card>

        {/* Approval Section */}
        {preflightPassed && needsApproval && !isApproved && (
          <Card className="mb-6 bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Step 1: Approve USDC</h2>
            <p className="mb-4 text-sm text-gray-600">
              The bridge needs permission to transfer your USDC. This is a one-time approval.
            </p>
            <Button
              onClick={handleApprove}
              disabled={isApproving || transactionStatus === 'approving' || isSwitchingNetwork}
              className="w-full"
            >
              {isSwitchingNetwork
                ? `Switching to ${CHAIN_NAMES[fromChainId]}...`
                : isApproving || transactionStatus === 'approving'
                ? 'Approving USDC...'
                : !isCorrectNetwork
                ? `Switch to ${CHAIN_NAMES[fromChainId]} & Approve`
                : 'Approve USDC'}
            </Button>

            {/* 🔥 NEW: Cancel button during approval */}
            {(isApproving || transactionStatus === 'approving') && (
              <button
                onClick={handleCancel}
                className="mt-2 w-full text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Cancel
              </button>
            )}

            {/* 🔥 NEW: Show transaction link and status */}
            {approvalHash && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {isApproving ? '⏳ Waiting for confirmation...' : '✅ Approval confirmed!'}
                </p>
                <a
                  href={`https://basescan.org/tx/${approvalHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View on BaseScan →
                </a>
              </div>
            )}
          </Card>
        )}

        {/* Execute Section */}
        {preflightPassed && (!needsApproval || isApproved) && transactionStatus === 'idle' && (
          <Card className="mb-6 bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {needsApproval ? '✅ Step 2: Execute Transfer' : 'Execute Transfer'}
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Send {transferAmount} USDC to {CHAIN_NAMES[toChainId]} via {selectedRoute.routeName}
            </p>
            <Button
              onClick={handleExecute}
              disabled={isExecuting || isSwitchingNetwork}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSwitchingNetwork
                ? `Switching to ${CHAIN_NAMES[fromChainId]}...`
                : isExecuting
                ? 'Executing Transfer...'
                : !isCorrectNetwork
                ? `Switch to ${CHAIN_NAMES[fromChainId]} & Execute`
                : 'Confirm Transfer'}
            </Button>

            {/* 🔥 NEW: Cancel button during execution */}
            {isExecuting && (
              <button
                onClick={handleCancel}
                className="mt-2 w-full text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Cancel
              </button>
            )}
          </Card>
        )}

        {/* Transaction Status */}
        {transactionStatus !== 'idle' && (
          <TransactionStatus
            hash={transactionHash}
            chainId={fromChainId}
            status={transactionStatus}
            error={transactionError}
          />
        )}

        {/* Errors */}
        {!preflightPassed && !isLoadingBalance && !isLoadingRoute && !isLoadingGas && (
          <Card className="border-2 border-red-200 bg-red-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-red-900">Cannot Proceed</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {!isCorrectNetwork && (
                <li>Please switch to {CHAIN_NAMES[fromChainId]} in your wallet</li>
              )}
              {!hasSufficientBalance && (
                <li>Insufficient USDC balance (need {transferAmount} USDC, have {balance} USDC)</li>
              )}
              {!hasEnoughGas && (
                <li>Insufficient {nativeSymbol} for gas fees (need ~{estimatedGasFormatted} {nativeSymbol}, have {parseFloat(ethBalance).toFixed(4)} {nativeSymbol})</li>
              )}
              {!hasValidSpender && hasRouteData && (
                <li>Invalid approval address - route data may be incomplete</li>
              )}
              {routeError && (
                <li>Failed to load route: {routeError}</li>
              )}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
