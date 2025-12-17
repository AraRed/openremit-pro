/**
 * 🎯 WHY: Route Details Bottom Sheet
 *
 * Modern mobile-first confirmation modal that slides up from bottom.
 * Handles the COMPLETE transaction flow inside the modal:
 * 1. Shows route details
 * 2. Runs pre-flight checks
 * 3. Handles USDC approval (Step 1 of 2)
 * 4. Executes bridge transaction (Step 2 of 2)
 * 5. Shows success/error states
 *
 * Better UX than full-page navigation (like Uniswap, Venmo):
 * - Faster (no page load)
 * - More mobile-friendly (bottom sheet pattern)
 * - Less cognitive load (user stays in context)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import { Button, Card } from '@/components/ui'
import { NetworkIcon } from '@/components'
import { getChainById } from '@/lib/chains'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useNativeBalance } from '@/hooks/useNativeBalance'
import { useTokenApproval } from '@/hooks/useTokenApproval'
import { useBridgeTransaction } from '@/hooks/useBridgeTransaction'
import type { Route, BridgeParams } from '@/lib/types'

interface RouteDetailsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void // Called when transaction succeeds
  route: Route | null
  fromChainId: number
  toChainId: number
  amount: string
  recipientAddress?: string // Recipient wallet address
}

type TxStatus = 'idle' | 'wallet-approval' | 'approving' | 'wallet-execution' | 'executing' | 'success' | 'error'

export function RouteDetailsBottomSheet({
  isOpen,
  onClose,
  onSuccess,
  route,
  fromChainId,
  toChainId,
  amount,
  recipientAddress,
}: RouteDetailsBottomSheetProps) {
  const { address } = useAccount()
  const currentChainId = useChainId()

  const fromChain = getChainById(fromChainId)
  const toChain = getChainById(toChainId)

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null)
  const [spenderAddress, setSpenderAddress] = useState<string | null>(null)
  const [hasCompletedApproval, setHasCompletedApproval] = useState(false)

  // Balances
  const { balance: usdcBalance, balanceWei: usdcBalanceWei } = useTokenBalance(
    fromChainId,
    address
  )
  const { balanceWei: ethBalanceWei } = useNativeBalance(
    fromChainId,
    address
  )

  // Parse amount
  const transferAmountWei = parseUnits(amount, 6)

  // Gas estimation
  const estimatedGasWei =
    fromChainId === 1
      ? parseUnits('0.005', 18) // Mainnet: ~$15
      : parseUnits('0.00005', 18) // L2s: ~$0.15

  // Approval hook
  const {
    approve,
    isApproved,
    needsApproval,
    refetchAllowance,
  } = useTokenApproval(
    fromChainId,
    spenderAddress || '0x0000000000000000000000000000000000000000',
    transferAmountWei
  )

  // Bridge execution hook
  const { executeBridge } = useBridgeTransaction()

  // Extract spender address from route
  useEffect(() => {
    if (!route) return

    // @ts-ignore - rawSymbiosisData is added to route
    const symbiosisData = route.rawSymbiosisData
    if (symbiosisData?.approveTo) {
      setSpenderAddress(symbiosisData.approveTo)
      console.log('🔍 Spender address extracted:', symbiosisData.approveTo)
    }
  }, [route])

  // Pre-flight checks
  const hasSufficientUSDC = usdcBalanceWei >= transferAmountWei
  const hasSufficientGas = ethBalanceWei >= estimatedGasWei
  const isCorrectNetwork = currentChainId === fromChainId
  const hasValidSpender =
    spenderAddress && spenderAddress !== '0x0000000000000000000000000000000000000000'

  const preflightPassed =
    hasSufficientUSDC && hasSufficientGas && isCorrectNetwork && hasValidSpender

  // Handle approval
  const handleApprove = async () => {
    try {
      setTxStatus('wallet-approval')
      setErrorMessage(null)

      await approve()

      setTxStatus('approving')
      console.log('⏳ Waiting for approval confirmation...')

      // Wait a bit for confirmation, then refetch allowance
      setTimeout(async () => {
        await refetchAllowance()
        setHasCompletedApproval(true)
        setTxStatus('idle')
      }, 3000)
    } catch (error: any) {
      console.error('Approval failed:', error)

      // Handle user rejection gracefully
      if (error.message?.includes('User rejected') || error.code === 4001) {
        console.log('👋 User cancelled approval')
        setTxStatus('idle')
        // Don't show error for user cancellation
        return
      }

      // Handle other errors
      const errorMsg = error.message?.includes('insufficient funds')
        ? 'Not enough ETH for gas fees'
        : 'Approval failed. Please try again.'

      setErrorMessage(errorMsg)
      setTxStatus('error')
    }
  }

  // Handle execution
  const handleExecute = async () => {
    if (!route || !address) return

    try {
      setTxStatus('wallet-execution')
      setErrorMessage(null)

      const bridgeParams: BridgeParams = {
        route,
        fromChainId,
        toChainId,
        amount,
        fromAddress: address,
        toAddress: recipientAddress || address,
      }

      const txHash = await executeBridge(bridgeParams)

      setTxStatus('executing')
      console.log('⏳ Transaction submitted:', txHash)

      setSuccessTxHash(txHash)

      // Wait a bit then show success (prevents infinite loop from isSuccess)
      setTimeout(() => {
        setTxStatus('success')
        if (onSuccess && txHash) {
          onSuccess(txHash)
        }
      }, 2000)
    } catch (error: any) {
      console.error('Transaction failed:', error)

      // Handle user rejection gracefully
      if (error.message?.includes('User rejected') || error.code === 4001) {
        console.log('👋 User cancelled transaction')
        setTxStatus('idle')
        return
      }

      // Handle other errors
      const errorMsg = error.message?.includes('insufficient funds')
        ? 'Not enough ETH for gas fees'
        : 'Transaction failed. Please try again.'

      setErrorMessage(errorMsg)
      setTxStatus('error')
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when closing
      setTimeout(() => {
        setTxStatus('idle')
        setErrorMessage(null)
        setSuccessTxHash(null)
        setHasCompletedApproval(false)
      }, 300) // Wait for animation to complete
    }
  }, [isOpen])

  if (!route || !fromChain || !toChain) return null

  // Calculate fees
  const receivedAmount = route.recipientGets
  const feeAmount = parseFloat(amount) - receivedAmount
  const feePercent = (feeAmount / parseFloat(amount)) * 100

  // Determine current step
  const currentStep = txStatus === 'idle' && needsApproval && !isApproved ? 1 : 2
  const totalSteps = needsApproval && !isApproved ? 2 : 1

  // Determine button state and text
  const getButtonState = () => {
    if (!address) {
      return { text: 'Connect Wallet', disabled: true, onClick: () => {} }
    }

    if (!preflightPassed) {
      if (!hasSufficientUSDC) {
        return { text: `Insufficient USDC (${usdcBalance})`, disabled: true, onClick: () => {} }
      }
      if (!hasSufficientGas) {
        return {
          text: `Need ${fromChainId === 1 ? '0.005' : '0.00005'} ETH for gas`,
          disabled: true,
          onClick: () => {},
        }
      }
      if (!isCorrectNetwork) {
        return { text: 'Switch to ' + fromChain.name, disabled: true, onClick: () => {} }
      }
      return { text: 'Checking...', disabled: true, onClick: () => {} }
    }

    if (txStatus === 'wallet-approval') {
      return { text: '⏳ Check your wallet...', disabled: true, onClick: () => {} }
    }

    if (txStatus === 'approving') {
      return { text: 'Enabling USDC...', disabled: true, onClick: () => {} }
    }

    if (txStatus === 'wallet-execution') {
      return { text: '⏳ Check your wallet...', disabled: true, onClick: () => {} }
    }

    if (txStatus === 'executing') {
      return { text: 'Sending Transaction...', disabled: true, onClick: () => {} }
    }

    if (txStatus === 'success') {
      return { text: '✓ Transaction Submitted', disabled: true, onClick: () => {} }
    }

    if (needsApproval && !isApproved && !hasCompletedApproval) {
      return { text: 'Enable USDC', disabled: false, onClick: handleApprove }
    }

    return { text: 'Confirm Transfer 🚀', disabled: false, onClick: handleExecute }
  }

  const buttonState = getButtonState()

  // Get explorer URL
  const getExplorerUrl = (txHash: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      8453: 'https://basescan.org/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
    }
    return explorers[fromChainId] + txHash
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={txStatus === 'success' ? undefined : onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {txStatus === 'success' ? 'Transaction Submitted!' : 'Review Transfer'}
                </h2>
                {txStatus !== 'success' && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Success State */}
              {txStatus === 'success' && successTxHash && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-gray-900 font-medium">
                      Your transaction has been submitted to the network.
                    </p>
                    <p className="text-sm text-gray-600">
                      The recipient will receive ~{receivedAmount.toFixed(2)}{' '}
                      {route.recipientCurrency} in {route.time || '~2 mins'}.
                    </p>
                  </div>

                  <a
                    href={getExplorerUrl(successTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 px-4 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    View on Explorer →
                  </a>

                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg shadow-lg"
                  >
                    Done
                  </Button>
                </div>
              )}

              {/* Main Flow (not success) */}
              {txStatus !== 'success' && (
                <>
                  {/* Progress Indicator */}
                  {totalSteps > 1 && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <div className={`px-3 py-1 rounded-full ${currentStep === 1 ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                        {hasCompletedApproval ? '✓' : '1'} Enable USDC
                      </div>
                      <div className="w-8 h-px bg-gray-300" />
                      <div className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                        2 Transfer
                      </div>
                    </div>
                  )}

                  {/* USDC Enabled Badge */}
                  {(isApproved || hasCompletedApproval) && !needsApproval && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 px-4 rounded-xl">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">USDC Enabled!</span>
                    </div>
                  )}

                  {/* Route Details Card */}
                  <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <div className="space-y-4">
                      {/* You Pay */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <NetworkIcon chainId={fromChainId} size="md" />
                          <div>
                            <div className="text-sm text-gray-600">You Pay</div>
                            <div className="font-bold text-lg text-gray-900">{amount} USDC</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{fromChain.name}</div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </div>

                      {/* They Get */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <NetworkIcon chainId={toChainId} size="md" />
                          <div>
                            <div className="text-sm text-gray-600">They Get</div>
                            <div className="font-bold text-lg text-green-600">
                              ~{receivedAmount.toFixed(2)} {route.recipientCurrency || 'USDT'}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{toChain.name}</div>
                      </div>
                    </div>
                  </Card>

                  {/* Fee Breakdown */}
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Bridge Fee</span>
                      <span className="font-medium text-gray-900">
                        {feePercent.toFixed(2)}% (~${feeAmount.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Network Fee</span>
                      <span className="font-medium text-gray-900">
                        ~${fromChainId === 1 ? '10-15' : '0.05'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Est. Time</span>
                      <span className="font-medium text-gray-900">{route.time || '~2 mins'}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-gray-900 font-semibold">Total Fees</span>
                      <span className="text-gray-900 font-bold">
                        ${(feeAmount + (fromChainId === 1 ? 12.5 : 0.05)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-red-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Transaction Failed</p>
                          <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Helper Text for First-Time Approval */}
                  {needsApproval && !isApproved && !hasCompletedApproval && currentStep === 1 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-900">
                        <span className="font-semibold">First time sending USDC?</span> You need to do a one-time approval to unlock your tokens.
                      </p>
                    </div>
                  )}

                  {/* Wallet Check Message */}
                  {(txStatus === 'wallet-approval' || txStatus === 'wallet-execution') && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-sm text-purple-900 font-medium text-center">
                        Please sign the request in your wallet to continue
                      </p>
                      <p className="text-xs text-purple-700 text-center mt-1">
                        If on mobile, check your wallet app
                      </p>
                    </div>
                  )}

                  {/* Provider Badge */}
                  <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span>Powered by</span>
                    <span className="font-semibold text-blue-600">Symbiosis</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={buttonState.onClick}
                    disabled={buttonState.disabled}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buttonState.text}
                  </Button>

                  {/* Safety Note */}
                  <p className="text-xs text-center text-gray-500 mt-4">
                    By confirming, you authorize this cross-chain transfer. Transactions are
                    irreversible.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
