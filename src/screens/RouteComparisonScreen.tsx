/**
 * 🎯 WHY: RouteComparisonScreen - Compare All Routes
 *
 * Shows routes in tabs (Cheapest, Fastest, Popular)
 * with visual comparison and expandable fee breakdowns.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { Button, Card } from '@/components/ui'
import { ConnectWallet, WalletModal } from '@/components/wallet'
import { useAccount } from 'wagmi'
import type { Route } from '@/lib/types'

type TabType = 'cheapest' | 'fastest' | 'popular'

interface RouteComparisonScreenProps {
  onBack?: () => void
  isLoading?: boolean
}

export function RouteComparisonScreen({ onBack, isLoading = false }: RouteComparisonScreenProps) {
  const { routes, setSelectedRoute, setCurrentScreen } = useStore()
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('cheapest')
  // 🔥 NEW: Expand fee breakdown by default
  const [expandedRoute, setExpandedRoute] = useState<string | null>(routes[0]?.id || null)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Sort routes based on active tab
  const sortedRoutes = [...routes].sort((a, b) => {
    if (activeTab === 'cheapest') return a.totalCost - b.totalCost
    if (activeTab === 'fastest') return parseTime(a.time) - parseTime(b.time)
    return 0 // Popular - keep original order
  })

  // Always use first route after sorting (already sorted by the correct criteria)
  const bestRoute = sortedRoutes[0]

  // Show skeleton shimmer while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Card Skeleton */}
          <Card className="mb-4">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-300 rounded animate-pulse" />
            </div>
          </Card>

          <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    )
  }

  // If no routes available, show error
  if (!routes.length || !bestRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600">No routes available</p>
          <button
            onClick={onBack}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Wallet Status */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">Compare Routes</h1>
            </div>
            {/* Wallet Status Badge */}
            <ConnectWallet />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 🔥 HIDDEN: Tabs (only show if multiple routes available) */}
        {routes.length > 1 && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <TabButton
              active={activeTab === 'cheapest'}
              onClick={() => setActiveTab('cheapest')}
            >
              Cheapest
            </TabButton>
            <TabButton
              active={activeTab === 'fastest'}
              onClick={() => setActiveTab('fastest')}
            >
              Fastest
            </TabButton>
            <TabButton
              active={activeTab === 'popular'}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </TabButton>
          </div>
        )}

        {/* 🔥 HIDDEN: Cost Comparison Chart (only show if multiple routes) */}
        {routes.length > 1 && (
          <Card>
            <h3 className="font-semibold mb-4">Cost Comparison Chart</h3>
            <div className="flex items-end gap-4 h-32">
              {sortedRoutes.map((route, index) => {
                const maxCost = Math.max(...routes.map(r => r.totalCost))
                const height = (route.totalCost / maxCost) * 100

                return (
                  <div key={route.id} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-full rounded-t ${
                        route.id === bestRoute.id ? 'bg-green-500' : 'bg-blue-400'
                      }`}
                    />
                    <span className="text-xs text-gray-600 text-center">
                      {route.routeName.replace('via ', '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Route Cards */}
        <div className="space-y-4">
          {sortedRoutes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              isRecommended={route.id === bestRoute.id}
              recommendReason={activeTab}
              isExpanded={expandedRoute === route.id}
              onToggle={() => setExpandedRoute(
                expandedRoute === route.id ? null : route.id
              )}
            />
          ))}
        </div>

        {/* Action CTA - Connect Wallet or Execute Transfer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t-2 border-blue-500 rounded-lg shadow-xl p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Ready to proceed?</h3>
              <p className="text-sm text-gray-600">
                {isConnected
                  ? 'Execute this transfer using your connected wallet'
                  : 'Connect your wallet to execute this transfer'}
              </p>
            </div>
            {isConnected ? (
              <Button
                onClick={() => {
                  setSelectedRoute(bestRoute)
                  setCurrentScreen('transaction')
                }}
                size="lg"
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                Execute Transfer →
              </Button>
            ) : (
              <Button
                onClick={() => setShowWalletModal(true)}
                size="lg"
                className="whitespace-nowrap"
              >
                🔌 Connect Wallet
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  )
}

// Helper Components

function TabButton({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function RouteCard({
  route,
  isRecommended,
  recommendReason,
  isExpanded,
  onToggle
}: {
  route: Route
  isRecommended: boolean
  recommendReason: TabType
  isExpanded: boolean
  onToggle: () => void
}) {
  // Get readable reason text
  const getReasonText = () => {
    if (recommendReason === 'cheapest') return '(Cheapest)'
    if (recommendReason === 'fastest') return '(Fastest)'
    return '(Popular)'
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 border-2 ${
        isRecommended
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✨ Recommended {getReasonText()}
          </span>
        </div>
      )}

      {/* Route Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{route.routeName}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            ⚡ {route.time}
          </p>
        </div>
      </div>

      {/* Cost Info */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-xs text-gray-500">Recipient gets</p>
          <p className="text-2xl font-bold text-green-600">
            ${route.recipientGets.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total cost</p>
          <p className="text-xl font-semibold text-gray-900">
            ${route.totalCost.toFixed(2)} (
            {((route.totalCost / (route.recipientGets + route.totalCost)) * 100).toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Fee Breakdown Toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900"
      >
        <span className="flex items-center gap-2">
          📊 Fee breakdown
        </span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded Fee Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-1"
        >
          <p className="text-gray-600">{route.feeBreakdown}</p>
          <div className="bg-gray-50 p-2 rounded mt-2 space-y-1 text-xs">
            <p><span className="font-medium">Route ID:</span> {route.id}</p>
            {route.provider && (
              <p><span className="font-medium">Provider:</span> {route.provider}</p>
            )}
            {route.confidence && (
              <p><span className="font-medium">Confidence:</span> {route.confidence}</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Helper Functions

function parseTime(timeStr: string): number {
  // Extract number from "~ 3 Minutes" or "~ 1 Minute"
  const match = timeStr.match(/(\d+)/)
  return match?.[1] ? parseInt(match[1]) : 999
}
