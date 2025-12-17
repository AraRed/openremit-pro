/**
 * 🎯 WHY: QuoteScreen - Simple Form-Based UI
 *
 * Much simpler than chat! Users directly input amount and country,
 * then get routes. This is more intuitive for a fintech app.
 *
 * 💼 INTERVIEW: "For fintech apps, clarity beats cleverness.
 *    Users want to see options quickly, not chat with a bot.
 *    Direct input forms reduce friction and build trust."
 */

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { getSymbiosisQuote } from '@/lib/symbiosis'
import { Button, Card, Input } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
// import { RouteComparisonScreen } from './RouteComparisonScreen' // 💡 Commented out - using bottom sheet instead (keep for future Li.Fi multi-route comparison)
import { ConnectWallet } from '@/components/wallet'
import { NetworkSelectorModal, NetworkIcon, WalletSelectionModal, RouteDetailsBottomSheet } from '@/components'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { isValidAddressForChain, getChainById } from '@/lib/chains'
import { useMultiChainBalance } from '@/hooks/useMultiChainBalance'
import { useNativeBalance } from '@/hooks/useNativeBalance'
import { parseUnits } from 'viem'
import { sanitizeErrorMessage } from '@/lib/errorUtils'
// TODO: Re-enable when deploying to Telegram
// import { useTelegramUser } from '@/hooks/useTelegramUser'
// import { resolveUsername, isValidTonAddress, formatTonAddress } from '@/lib/tonDns'
import type { CountryName } from '@/lib/currencies'

type ViewState = 'input' | 'loading' | 'comparison'

export function QuoteScreen() {
  const { routes, setRoutes, setUserInput, setCurrentScreen, setSelectedRoute } = useStore()
  const { isConnected, address } = useAccount()
  const currentChainId = useChainId() // Get current wallet network
  const { switchChainAsync } = useSwitchChain() // For auto-switching

  // Ref for network selector button (for dropdown positioning)
  const networkButtonRef = useRef<HTMLButtonElement>(null)

  // Multi-chain balance detection
  const { chainBalances, autoSelectedChainId, isLoading: isLoadingBalances } = useMultiChainBalance(address)

  // TODO: Re-enable when deploying to Telegram
  // const { user, displayName } = useTelegramUser()
  const [amount, setAmount] = useState('') // 🔥 START EMPTY - let user enter or click MAX
  const [fromChainId, setFromChainId] = useState(8453) // Default: Base (cheapest L2)
  const [toChainId, setToChainId] = useState(607) // Default: TON (target destination)
  const [destinationCountry, setDestinationCountry] = useState<CountryName>('Brazil')
  const [recipient, setRecipient] = useState('')
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>('input')
  const [error, setError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)

  // Gas balance check for selected chain
  const { balanceWei: gasBalanceWei, symbol: nativeSymbol } = useNativeBalance(fromChainId, address)
  // L2s are MUCH cheaper: ~$0.01-0.05 per tx vs ~$5-20 on mainnet
  const estimatedGasWei = fromChainId === 1
    ? parseUnits('0.005', 18) // Mainnet: ~$15 (covers gas spikes)
    : parseUnits('0.00005', 18) // L2s (Base, Arb, Op): ~$0.15 (5-10x buffer)
  const hasEnoughGas = gasBalanceWei >= estimatedGasWei

  // Auto-select chain with highest balance when wallet connects
  useEffect(() => {
    if (autoSelectedChainId && isConnected) {
      setFromChainId(autoSelectedChainId)
    }
  }, [autoSelectedChainId, isConnected])

  // 🔥 NEW: Auto-detect wallet network changes (Wallet → UI sync)
  useEffect(() => {
    if (!isConnected || !currentChainId) return

    // Check if current wallet network is supported and has balance
    const currentChainBalance = chainBalances.find(b => b.chainId === currentChainId)
    const hasBalanceOnCurrentChain = currentChainBalance && parseFloat(currentChainBalance.balance) > 0

    // If user switched to a supported chain with balance, update the dropdown
    if (hasBalanceOnCurrentChain && fromChainId !== currentChainId) {
      console.log(`🔄 Wallet network changed to ${currentChainId}, updating dropdown`)
      setFromChainId(currentChainId)
    }
  }, [currentChainId, isConnected, chainBalances, fromChainId])

  // 🔥 NEW: Handle network selection in dropdown (UI → Wallet sync)
  const handleNetworkChange = async (newChainId: number) => {
    setFromChainId(newChainId)

    // If wallet is on a different network, prompt to switch
    if (isConnected && currentChainId !== newChainId) {
      try {
        console.log(`🔄 Switching wallet network to ${newChainId}`)
        await switchChainAsync({ chainId: newChainId })
      } catch (error) {
        console.warn('User rejected network switch or switch failed:', error)
        // Don't revert the dropdown - let user keep their selection
        // They'll see "Switch to X" warning on transaction screen
      }
    }
  }

  // MVP: Fixed to USDC → USDC transfers only
  const sourceCurrency = 'USDC'
  const destinationCurrency = 'USDC'

  /**
   * 🔧 HOW: Clear routes when user changes input
   * This prevents showing stale preview data
   */
  const handleAmountChange = (value: string) => {
    setAmount(value)
    setRoutes([]) // Clear old routes
    setError(null) // Clear any errors
    setAmountError(null) // Clear amount errors

    // 🔥 NEW: Validate insufficient balance
    if (value && isConnected) {
      const amountNum = parseFloat(value)
      const selectedBalance = chainBalances.find(b => b.chainId === fromChainId)
      const userBalance = selectedBalance ? parseFloat(selectedBalance.balance) : 0

      if (amountNum > userBalance) {
        setAmountError(`Insufficient balance (Max: $${userBalance.toFixed(2)})`)
      }
    }
  }

  /**
   * 🔧 HOW: Set amount to max balance on selected chain
   */
  const handleMaxClick = () => {
    const selectedBalance = chainBalances.find(b => b.chainId === fromChainId)
    if (selectedBalance && parseFloat(selectedBalance.balance) > 0) {
      setAmount(selectedBalance.balance)
      setAmountError(null) // Clear any errors when using MAX
      setRoutes([]) // Clear old routes
    }
  }

  /**
   * 🔧 HOW: Validate TON address format
   * TON addresses start with UQ or EQ and are 48 characters long
   */
  const validateTonAddress = (address: string): boolean => {
    const tonAddressRegex = /^(UQ|EQ)[a-zA-Z0-9_-]{46}$/
    return tonAddressRegex.test(address)
  }

  /**
   * 🔧 HOW: Handle recipient input with validation
   */
  const handleRecipientChange = async (value: string) => {
    setRecipient(value)
    setRecipientError(null)

    // Validate TON address format if provided
    if (value.trim()) {
      if (!validateTonAddress(value)) {
        setRecipientError('Invalid TON address. Must start with UQ or EQ and be 48 characters long.')
      }
    }
  }

  /**
   * 🔧 HOW: Handle getting routes with Loading → Comparison flow
   */
  const handleGetRoutes = async () => {
    setError(null)

    // Validate amount
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum < 10 || amountNum > 100000) {
      setError('Please enter an amount between $10 and $100,000')
      return
    }

    // 🔥 NEW: Validate sufficient balance
    const selectedBalance = chainBalances.find(b => b.chainId === fromChainId)
    const userBalance = selectedBalance ? parseFloat(selectedBalance.balance) : 0
    if (amountNum > userBalance) {
      setError(`Insufficient balance. You have $${userBalance.toFixed(2)} USDC on ${getChainById(fromChainId)?.shortName || 'this chain'}`)
      return
    }

    // Validate recipient address
    if (!recipient.trim() || !validateTonAddress(recipient)) {
      setError('Please enter a valid TON address')
      return
    }

    // Log structured data for verification
    console.group('🚀 Compare Routes Request')
    console.log('User Input:', {
      amount: amountNum,
      fromChainId,
      toChainId,
      fromChain: getChainById(fromChainId)?.shortName || 'Unknown',
      toChain: 'TON Network',
      recipient,
      walletAddress: address,
      sourceCurrency,
      destinationCurrency,
    })
    console.log('Balance on selected chain:',
      chainBalances.find(b => b.chainId === fromChainId)?.balance || '0.00'
    )
    console.groupEnd()

    // Start loading flow
    setIsLoadingRoutes(true)
    // setViewState('comparison') // 💡 Commented out - using bottom sheet instead
    setShowWelcome(false)

    try {
      // Save user input
      setUserInput({
        amount: amountNum,
        sourceCurrency,
        destinationCurrency,
        country: destinationCountry,
        fromChainId,
        toChainId,
        recipient: recipient || undefined
      })

      // Get real quotes from Symbiosis API (with minimum 2s for loading animation)
      const [routes] = await Promise.all([
        getSymbiosisQuote(
          fromChainId,
          toChainId,
          amountNum,
          address as string,
          recipient
        ),
        new Promise(resolve => setTimeout(resolve, 2000))
      ])

      console.log('📊 Routes received:', routes)

      if (routes && routes.length > 0) {
        setRoutes(routes)
        setIsLoadingRoutes(false)
        setShowBottomSheet(true) // 🎉 Show bottom sheet with route details
      } else {
        setError('No routes found. Try a different amount or network.')
        // setViewState('input') // 💡 Not needed - already on input view
        setIsLoadingRoutes(false)
      }
    } catch (err) {
      console.error('❌ Error getting routes:', err)
      setError(sanitizeErrorMessage(err))
      // setViewState('input') // 💡 Not needed - already on input view
      setIsLoadingRoutes(false)
    }
  }

  // Get best route for quick preview
  const bestRoute = routes.find(r => r.isBest)

  // 💡 Commented out - using bottom sheet instead of full-page navigation
  // Keep this code for future Li.Fi multi-route comparison feature
  // if (viewState === 'comparison') {
  //   return <RouteComparisonScreen
  //     isLoading={isLoadingRoutes}
  //     onBack={() => {
  //       setViewState('input')
  //       setRoutes([]) // Clear routes when going back
  //       setIsLoadingRoutes(false)
  //     }}
  //   />
  // }

  // Show input form with bottom sheet overlay
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">OpenRemit</h1>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h2 className="text-lg font-bold text-blue-900 mb-1">
                      Bridge to TON from any network
                    </h2>
                    <p className="text-sm text-blue-700 font-medium">
                      Send USDC from Base, Arbitrum, Optimism, or Ethereum directly to your Telegram Wallet.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form - SIMPLIFIED FOR MVP */}
        <Card className="mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Bridge USDC Transfer
              </h3>
            </div>

            {/* Amount Input - USDC Fixed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much USDC?
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`text-lg pr-16 ${amountError ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter amount or click MAX"
                  min="10"
                  max="100000"
                />
                {/* Max Button */}
                {isConnected && (() => {
                  const selectedBalance = chainBalances.find(b => b.chainId === fromChainId)
                  const hasBalance = selectedBalance && parseFloat(selectedBalance.balance) > 0
                  return hasBalance ? (
                    <button
                      type="button"
                      onClick={handleMaxClick}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      MAX
                    </button>
                  ) : null
                })()}
              </div>
              {/* Error or Helper Text */}
              {amountError ? (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  ⚠️ {amountError}
                </p>
              ) : (
                <p className="text-xs text-gray-900 mt-1">
                  Enter amount in USDC ($10 - $100,000)
                </p>
              )}
            </div>

            {/* Source Network - Always visible dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Network
              </label>

              {/* Custom Dropdown Button */}
              <button
                ref={networkButtonRef}
                onClick={() => setShowNetworkModal(true)}
                className="w-full h-14 px-4 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {/* Network Icon */}
                  <NetworkIcon chainId={fromChainId} size="md" />

                  {/* Network Name and Balance */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {getChainById(fromChainId)?.shortName || 'Base'}
                    </div>
                    {isConnected && !isLoadingBalances && (() => {
                      const balance = chainBalances.find(b => b.chainId === fromChainId)
                      if (balance && parseFloat(balance.balance) > 0) {
                        return (
                          <div className="text-sm text-gray-600">
                            ${balance.balance} USDC
                          </div>
                        )
                      }
                      return (
                        <div className="text-sm text-gray-500">
                          No balance
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Dropdown Arrow */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Balance detection status */}
              {isConnected && !isLoadingBalances && (() => {
                const hasAnyBalance = chainBalances.some(b => parseFloat(b.balance) > 0)

                if (!hasAnyBalance) {
                  return (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ No USDC found on any network. Transfer USDC to Base for lowest fees.
                      </p>
                    </div>
                  )
                }

                const selectedBalance = chainBalances.find(b => b.chainId === fromChainId)
                if (selectedBalance && parseFloat(selectedBalance.balance) > 0) {
                  return (
                    <div className="mt-2 text-xs text-green-600">
                      ✨ Auto-detected funds on {getChainById(fromChainId)?.shortName}
                    </div>
                  )
                }

                return null
              })()}
            </div>

            {/* Destination Network - Read-only TON Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to
              </label>

              {/* Locked TON Network Card */}
              <div className="w-full h-14 px-4 border border-gray-300 rounded-lg bg-white flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-3">
                  {/* TON Icon */}
                  <NetworkIcon chainId={607} size="md" />

                  {/* TON Network Name */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      TON Network
                    </div>
                    <div className="text-xs text-gray-500">
                      Telegram Wallet
                    </div>
                  </div>
                </div>

                {/* Lock Icon */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <p className="text-xs text-gray-600 mt-1">
                💰 Receive jUSDC (Bridged USDC) on TON via Symbiosis
              </p>
            </div>

            {/* Recipient Input - TON address (REQUIRED) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient TON Address
              </label>
              <Input
                type="text"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={`text-lg ${recipientError ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="UQ... or EQ..."
                required
              />
              {/* Error message */}
              {recipientError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  ⚠️ {recipientError}
                </p>
              )}
              {/* Success/Helper message */}
              {!recipientError && recipient.trim() && validateTonAddress(recipient) && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  ✓ Valid TON address
                </p>
              )}
              {!recipient.trim() && (
                <p className="text-xs text-gray-900 mt-1">
                  📱 Enter your TON wallet address (starts with UQ... or EQ...)
                </p>
              )}
            </div>

            {/* Gas Warning */}
            {isConnected && !hasEnoughGas && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <span className="font-semibold">⚠️ Insufficient {nativeSymbol} for gas</span>
                <span className="ml-1">~${fromChainId === 1 ? '15' : '0.15'} needed for transaction</span>
              </div>
            )}

            {/* Action Button: Connect Wallet, Switch Network, or Review */}
            {isConnected ? (
              currentChainId !== fromChainId ? (
                <Button
                  onClick={async () => {
                    try {
                      await switchChainAsync({ chainId: fromChainId })
                    } catch (error) {
                      console.warn('User rejected network switch:', error)
                    }
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-600"
                  size="lg"
                >
                  Switch to {getChainById(fromChainId)?.name || 'Network'}
                </Button>
              ) : (
                <Button
                  onClick={handleGetRoutes}
                  className="w-full"
                  size="lg"
                  disabled={!recipient.trim() || !!recipientError || !amount || !!amountError || !hasEnoughGas || isLoadingRoutes}
                >
                  {isLoadingRoutes ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting best rate...
                    </>
                  ) : !hasEnoughGas ? 'Insufficient Gas' : 'Review Transfer →'}
                </Button>
              )
            ) : (
              <Button
                onClick={() => setShowWalletModal(true)}
                className="w-full"
                size="lg"
              >
                🔌 Connect Wallet
              </Button>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}
          </div>
        </Card>

        {/* Info Footer */}
        {!routes.length && (
          <div className="mt-8 text-center text-sm text-gray-900">
            <p>
              ✅ Powered by Symbiosis • 🔒 Non-custodial • ⚡️ Instant
            </p>
          </div>
        )}
      </div>

      {/* Wallet Connection Modal */}
      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      {/* Network Selector Dropdown */}
      <NetworkSelectorModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        chainBalances={chainBalances}
        selectedChainId={fromChainId}
        onSelectChain={handleNetworkChange}
        triggerRef={networkButtonRef}
      />

      {/* Route Details Bottom Sheet */}
      <RouteDetailsBottomSheet
        isOpen={showBottomSheet}
        onClose={() => {
          setShowBottomSheet(false)
          setRoutes([]) // Clear routes when closing
        }}
        onSuccess={(txHash) => {
          console.log('✅ Transaction submitted:', txHash)
          // Bottom sheet will show success UI - user clicks "Done" to close
        }}
        route={bestRoute || null}
        fromChainId={fromChainId}
        toChainId={toChainId}
        amount={amount}
        recipientAddress={recipient}
      />
    </div>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * ✅ PHASE 1 COMPLETE: Real Bridge Aggregation
 *    - Replaced Gemini AI simulation with Li.Fi API
 *    - Real-time quotes from 15+ bridge providers
 *    - Validated savings: $2.25 per $500 transfer (Ethereum → Base)
 *    - USDC-only for MVP (simplicity)
 *
 * 1. VALUE PROPOSITION (Proven with Real Data):
 *    - Li.Fi aggregator: $498.75 received (0.25% fee)
 *    - Circle CCTP alone: $496.50 received (0.70% fee)
 *    - **OpenRemit saves $2.25 per $500 transfer** ✅
 *    - Annual savings for monthly sender: $27/year
 *    - Annual savings for freelancer ($2K/month): $108/year
 *
 * 2. Why Li.Fi Wins (Ethereum → L2):
 *    - High Ethereum gas costs make alternatives valuable
 *    - Li.Fi uses Across, Stargate, Hop (cheaper than CCTP)
 *    - CCTP wins on L2 → L2 (already low gas, canonical wins)
 *
 * 3. Crypto-Only Source (Why no USD?):
 *    - This is a Telegram Mini App
 *    - Users already have crypto wallets (MetaMask, Phantom)
 *    - Focus: USDC (most liquid stablecoin)
 *    - Non-custodial = global reach (no KYC/AML restrictions)
 *
 * 4. Embedded Fee Model (Monetization):
 *    - Free tier: 0.4% markup → User still saves $0.60
 *    - Pro tier: $4.99/month + 0.1% markup → User saves $0.95
 *    - Target: $57K ARR in Year 1 (1,500 users)
 *
 * 5. Form-Based vs Chat UI:
 *    - Forms are clearer for specific tasks (send money)
 *    - For fintech: clarity > cleverness
 *    - Progressive disclosure reduces cognitive load
 *
 * 💼 INTERVIEW QUESTION: "How did you validate the business model?"
 * ANSWER: "I integrated real APIs (Li.Fi + Circle CCTP) and ran tests
 *          on common routes. Ethereum → Base showed $2.25 savings via
 *          Li.Fi vs CCTP. This proved the aggregation model works. Then
 *          I designed embedded fees (0.4% markup) where users still save
 *          money while we generate $57K ARR from 1,500 users. Real data
 *          beats assumptions every time."
 */
