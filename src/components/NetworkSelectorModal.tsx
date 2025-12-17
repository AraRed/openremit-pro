/**
 * Network Selector Modal - Professional DeFi-style UI
 *
 * Displays all available networks with balances, icons, and selection state
 * Inspired by Uniswap's network selector
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, type RefObject } from 'react'
import type { ChainBalance } from '@/hooks/useMultiChainBalance'
import { getChainById } from '@/lib/chains'
import { NetworkIcon } from './NetworkIcon'

interface NetworkSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  chainBalances: ChainBalance[]
  selectedChainId: number
  onSelectChain: (chainId: number) => void
  triggerRef: RefObject<HTMLButtonElement>
}

// Network Row Component
interface NetworkRowProps {
  chain: { chainId: number; chainName: string; balance: string }
  isSelected: boolean
  hasBalance: boolean
  onSelect: (chainId: number) => void
}

function NetworkRow({ chain, isSelected, hasBalance, onSelect }: NetworkRowProps) {
  return (
    <motion.button
      onClick={() => onSelect(chain.chainId)}
      disabled={!hasBalance}
      whileHover={hasBalance ? { backgroundColor: 'rgba(0, 0, 0, 0.02)' } : {}}
      whileTap={hasBalance ? { scale: 0.98 } : {}}
      className={`
        w-full px-6 py-4 flex items-center justify-between
        transition-colors text-left
        ${!hasBalance ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}
      `}
    >
      {/* Left side - Icon + Name */}
      <div className="flex items-center gap-3">
        {/* Network Icon */}
        <NetworkIcon chainId={chain.chainId} size="lg" />

        {/* Chain Name */}
        <div>
          <div className="font-medium text-gray-900">
            {chain.chainName}
          </div>
        </div>
      </div>

      {/* Right side - Balance + Checkmark */}
      <div className="flex items-center gap-3">
        {/* Balance */}
        <div className="text-right">
          <div className={`
            text-base font-semibold
            ${hasBalance ? 'text-gray-900' : 'text-gray-400'}
          `}>
            ${chain.balance}
          </div>
          <div className="text-xs text-gray-500">
            USDC
          </div>
        </div>

        {/* Checkmark for selected */}
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  )
}

export function NetworkSelectorModal({
  isOpen,
  onClose,
  chainBalances,
  selectedChainId,
  onSelectChain,
  triggerRef,
}: NetworkSelectorModalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  // Calculate position based on trigger button
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap below button
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen, triggerRef])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectChain = (chainId: number) => {
    onSelectChain(chainId)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop for click-outside detection */}
          <div
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown Popover */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15), 0px 8px 32px rgba(0, 0, 0, 0.1)',
            }}
            className="z-50"
          >
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select Network
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Choose where to send USDC from
                </p>
              </div>

              {/* Network List */}
              <div className="max-h-96 overflow-y-auto">
                {chainBalances.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">Loading balances...</p>
                  </div>
                ) : (() => {
                  // Sort chains into two groups
                  const sortedChains = [...chainBalances].sort((a, b) => {
                    const aBalance = parseFloat(a.balance)
                    const bBalance = parseFloat(b.balance)

                    // Chains with balance come first
                    if (aBalance > 0 && bBalance === 0) return -1
                    if (aBalance === 0 && bBalance > 0) return 1

                    // Among chains with balance, sort by amount (highest first)
                    if (aBalance > 0 && bBalance > 0) {
                      return bBalance - aBalance
                    }

                    return 0
                  })

                  const availableChains = sortedChains.filter(c => parseFloat(c.balance) > 0)
                  const unavailableChains = sortedChains.filter(c => parseFloat(c.balance) === 0)

                  return (
                    <div>
                      {/* Available Networks Section */}
                      {availableChains.length > 0 && (
                        <div>
                          <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Available Networks
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {availableChains.map((chain) => {
                              const isSelected = chain.chainId === selectedChainId
                              return (
                                <NetworkRow
                                  key={chain.chainId}
                                  chain={chain}
                                  isSelected={isSelected}
                                  hasBalance={true}
                                  onSelect={handleSelectChain}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Other Networks Section */}
                      {unavailableChains.length > 0 && (
                        <div>
                          <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Other Networks
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {unavailableChains.map((chain) => {
                              const isSelected = chain.chainId === selectedChainId
                              return (
                                <NetworkRow
                                  key={chain.chainId}
                                  chain={chain}
                                  isSelected={isSelected}
                                  hasBalance={false}
                                  onSelect={handleSelectChain}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  💡 We recommend using Base or Optimism for lower fees
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
