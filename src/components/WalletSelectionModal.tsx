/**
 * 🎯 WHY: Custom Wallet Selection Modal
 *
 * Mobile-first wallet connection UI optimized for Telegram Mini Apps.
 * Groups wallets by action (FaceID vs QR/Deep Link) instead of by brand.
 *
 * Smart Grouping:
 * 1. Featured: Coinbase Smart Wallet (FaceID/Passkeys - best for mobile)
 * 2. Mobile Apps: WalletConnect (Deep linking to Robinhood, Trust, MetaMask Mobile)
 * 3. Desktop/Other: MetaMask extension (fallback for desktop users)
 */

import { useConnect } from 'wagmi'
import { useEffect } from 'react'

interface WalletSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletSelectionModal({ isOpen, onClose }: WalletSelectionModalProps) {
  const { connectors, connect, isPending } = useConnect()

  // Find specific connectors by ID
  const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK')
  const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect')

  // Handle wallet selection
  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId)
    if (connector) {
      connect({ connector })
      onClose()
    }
  }

  // Close modal on successful connection
  useEffect(() => {
    if (!isPending) {
      // You can add success toast here if needed
    }
  }, [isPending])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal - Bottom Sheet on Mobile, Centered Card on Desktop */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0">
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md mx-auto md:max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Featured: Coinbase Smart Wallet */}
            {coinbaseConnector && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recommended
                </h3>
                <button
                  onClick={() => handleConnect(coinbaseConnector.id)}
                  disabled={isPending}
                  className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    {/* Coinbase Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="24" fill="#0052FF" />
                        <path
                          d="M24 36C30.6274 36 36 30.6274 36 24C36 17.3726 30.6274 12 24 12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36Z"
                          fill="white"
                        />
                        <path
                          d="M21 21H27V27H21V21Z"
                          fill="#0052FF"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg">Smart Wallet</div>
                      <div className="text-sm text-blue-100 mt-0.5">
                        Instant login with FaceID / TouchID
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}

            {/* Mobile Apps: WalletConnect */}
            {walletConnectConnector && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Mobile Wallet Apps
                </h3>
                <button
                  onClick={() => handleConnect(walletConnectConnector.id)}
                  disabled={isPending}
                  className="w-full p-4 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    {/* WalletConnect Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                        <path
                          d="M11.25 14.5C15.5 10.25 22.5 10.25 26.75 14.5L27.25 15L30 12.25L29.5 11.75C23.75 6 14.25 6 8.5 11.75L8 12.25L10.75 15L11.25 14.5Z"
                          fill="#3B99FC"
                        />
                        <path
                          d="M32 16L29.25 18.75L29.75 19.25C34 23.5 34 30.5 29.75 34.75L29.25 35.25L32 38L32.5 37.5C38.25 31.75 38.25 22.25 32.5 16.5L32 16Z"
                          fill="#3B99FC"
                        />
                        <path
                          d="M8 38L10.75 35.25L10.25 34.75C6 30.5 6 23.5 10.25 19.25L10.75 18.75L8 16L7.5 16.5C1.75 22.25 1.75 31.75 7.5 37.5L8 38Z"
                          fill="#3B99FC"
                        />
                        <path
                          d="M19.5 25.5C17.5 25.5 16 24 16 22C16 20 17.5 18.5 19.5 18.5C21.5 18.5 23 20 23 22C23 24 21.5 25.5 19.5 25.5Z"
                          fill="#3B99FC"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-900 text-lg">Mobile Wallet Apps</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        Robinhood, Trust, MetaMask Mobile, etc.
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}


            {/* Helper Text */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By connecting, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * 🎓 HOW TO USE:
 *
 * 1. Add state for modal visibility in your component:
 *    const [showWalletModal, setShowWalletModal] = useState(false)
 *
 * 2. Render the modal:
 *    <WalletSelectionModal
 *      isOpen={showWalletModal}
 *      onClose={() => setShowWalletModal(false)}
 *    />
 *
 * 3. Trigger it with a button:
 *    <button onClick={() => setShowWalletModal(true)}>
 *      Connect Wallet
 *    </button>
 *
 * 4. On mobile (Telegram), WalletConnect will use Deep Linking:
 *    - User taps "Mobile Wallet Apps"
 *    - Phone shows "Open in..." dialog
 *    - User selects Robinhood/Trust/MetaMask
 *    - App switches automatically
 *    - User approves and switches back
 */
