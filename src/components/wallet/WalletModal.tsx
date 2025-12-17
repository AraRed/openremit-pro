/**
 * 🎯 WHY: Professional Wallet Connection Modal
 *
 * Shows a clean modal popup with wallet options.
 * Industry standard: Uniswap, OpenSea, 1inch all use this pattern.
 */

import { useState, useEffect } from 'react'
import { useConnect, useAccount } from 'wagmi'
import { Button } from '../ui'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [wcUri, setWcUri] = useState<string | null>(null)

  // Auto-close modal when wallet connects successfully
  useEffect(() => {
    if (isConnected && isOpen) {
      // Close modal after successful connection
      handleClose()
    }
  }, [isConnected, isOpen])

  // Reset state when modal closes
  const handleClose = () => {
    setWcUri(null)
    setError(null)
    onClose()
  }

  // Go back to wallet options
  const handleBack = () => {
    setWcUri(null)
    setError(null)
  }

  const handleConnect = async (connector: any) => {
    setError(null)
    setWcUri(null)

    try {
      console.log('Attempting to connect with:', connector.name)

      // For WalletConnect, we need to get the URI
      if (connector.id === 'walletConnect') {
        // Get the provider to access the URI
        const provider = await connector.getProvider()

        // Listen for the display_uri event
        provider.events.on('display_uri', (uri: string) => {
          console.log('WalletConnect URI:', uri)
          setWcUri(uri)
        })
      }

      await connect({ connector })

      // Modal will auto-close via useEffect when connection succeeds
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      setWcUri(null)
    }
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {wcUri && (
                    <button
                      onClick={handleBack}
                      className="text-gray-600 hover:text-gray-900 text-xl"
                    >
                      ←
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* WalletConnect QR Code Display */}
              {wcUri ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      📱 How to scan:
                    </p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Open your mobile wallet app (Trust Wallet, Rainbow, MetaMask Mobile)</li>
                      <li>Find the "WalletConnect" or "Scan QR" option in the app</li>
                      <li>Use the in-app scanner to scan this QR code</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2 italic">
                      ⚠️ Don't use your phone's camera app - it won't work!
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
                    <QRCodeSVG
                      value={wcUri}
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1"
                    >
                      ← Back to Options
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(wcUri)
                        alert('URI copied to clipboard!')
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      📋 Copy URI
                    </Button>
                  </div>
                </div>
              ) : (
                /* Wallet Options */
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => handleConnect(connector)}
                      className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        {connector.name[0]}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {connector.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {connector.name === 'Injected' ? 'Browser Wallet' : 'Mobile Wallet'}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400 group-hover:text-blue-600">
                        →
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {error}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Make sure you have MetaMask installed and unlocked.
                  </p>
                </div>
              )}

              {/* Footer Help Text */}
              <p className="text-xs text-gray-500 text-center mt-6">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Modal UX Best Practices:
 *    - Backdrop (dark overlay) to focus attention
 *    - Close on backdrop click for easy dismissal
 *    - Escape key support (optional enhancement)
 *    - Smooth animations for professional feel
 *
 * 2. Why This Pattern Wins:
 *    - Keeps main UI clean (no clutter)
 *    - Shows options only when needed
 *    - Professional appearance (builds trust)
 *    - Mobile-friendly (centered, responsive)
 *
 * 3. Connector Display Logic:
 *    - Injected = Browser wallet (MetaMask, Coinbase)
 *    - WalletConnect = Mobile wallets (Trust, Rainbow)
 *    - Show helpful descriptions for clarity
 *
 * 💼 INTERVIEW TIP:
 * "I use a modal for wallet selection to keep the UI clean.
 *  This is the industry standard - you see it in Uniswap,
 *  OpenSea, and all major DeFi apps. It reduces cognitive
 *  load and only shows options when the user asks for them."
 */
