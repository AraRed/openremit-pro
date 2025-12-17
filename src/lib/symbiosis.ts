/**
 * Symbiosis API Integration for Base → TON Bridging
 *
 * Important Notes:
 * - Updated to use Native USDC on Base (most users have this, not USDbC)
 * - TON uses USDT in Symbiosis, not USDC/jUSDC
 * - TON chain ID in Symbiosis is 85918 (not 607 which is TON's standard chain ID)
 * - Route: Base USDC → TON USDT
 */

import type { Route as AppRoute } from './types'

// Symbiosis API endpoint
const SYMBIOSIS_API_BASE = 'https://api.symbiosis.finance/crosschain/v1'

// Token configurations for Symbiosis
const SYMBIOSIS_TOKENS = {
  BASE_USDC: {
    chainId: 8453,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC (not USDbC)
    decimals: 6,
    symbol: 'USDC',
  },
  TON_USDT: {
    chainId: 85918, // Symbiosis's TON chain ID
    address: '0x9328Eb759596C38a25f59028B146Fecdc3621Dfe',
    decimals: 6,
    symbol: 'USDT',
  },
} as const

interface SymbiosisSwapResponse {
  tokenAmountOut: {
    amount: string
    symbol: string
    decimals: number
  }
  tokenAmountOutMin: {
    amount: string
  }
  amountInUsd: {
    amount: string
  }
  estimatedTime: number
  priceImpact: string
  fees: Array<{
    provider: string
    value: {
      amount: string
      decimals: number
      symbol: string
    }
    description: string
  }>
  routes: Array<{
    provider: string
    tokens: Array<{
      symbol: string
      chainId: number
    }>
  }>
  approveTo: string
  tx: {
    chainId: number
    data: string
    to: string
    value: string
  }
}

/**
 * Get bridge quote from Base (USDbC) to TON (USDT) using Symbiosis API
 *
 * @param fromChainId - Source chain ID (should be 8453 for Base)
 * @param toChainId - Destination chain ID (should be 607 for TON, but we map to 85918 internally)
 * @param amount - Amount in USDC units (e.g., 500 for $500)
 * @param fromAddress - Sender's EVM address
 * @param toAddress - Recipient's TON address (EQ... format)
 * @returns Array of bridge routes with pricing and timing
 */
export async function getSymbiosisQuote(
  fromChainId: number,
  toChainId: number,
  amount: number,
  fromAddress: string,
  toAddress: string
): Promise<AppRoute[]> {
  console.log('🔍 Fetching Symbiosis quote...', {
    fromChainId,
    toChainId,
    amount,
    fromAddress,
    toAddress,
  })

  // Validate chains
  if (fromChainId !== 8453) {
    throw new Error('Source chain must be Base (8453) for Symbiosis bridging')
  }

  if (toChainId !== 607) {
    throw new Error('Destination chain must be TON (607)')
  }

  // Validate TON address format
  if (!toAddress.startsWith('EQ') && !toAddress.startsWith('UQ')) {
    throw new Error('Invalid TON address. Must start with EQ or UQ')
  }

  // Convert amount to wei (6 decimals for USDbC)
  const amountWei = (amount * 1_000_000).toString()

  // Build swap request
  const swapRequest = {
    tokenAmountIn: {
      chainId: SYMBIOSIS_TOKENS.BASE_USDC.chainId,
      address: SYMBIOSIS_TOKENS.BASE_USDC.address,
      decimals: SYMBIOSIS_TOKENS.BASE_USDC.decimals,
      symbol: SYMBIOSIS_TOKENS.BASE_USDC.symbol,
      amount: amountWei,
    },
    tokenOut: {
      chainId: SYMBIOSIS_TOKENS.TON_USDT.chainId,
      address: SYMBIOSIS_TOKENS.TON_USDT.address,
      decimals: SYMBIOSIS_TOKENS.TON_USDT.decimals,
      symbol: SYMBIOSIS_TOKENS.TON_USDT.symbol,
    },
    from: fromAddress,
    to: toAddress, // TON address (EQ... format)
    slippage: 300, // 3% (300 basis points)
    deadline: 1800, // 30 minutes
  }

  console.log('📤 Calling Symbiosis API:', swapRequest)

  // Call Symbiosis API
  const response = await fetch(`${SYMBIOSIS_API_BASE}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(swapRequest),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Symbiosis API error: ${errorData.message || response.statusText}`
    )
  }

  const data: SymbiosisSwapResponse = await response.json()

  console.log('✅ Symbiosis API response:', data)

  // Calculate fees
  const totalFees = data.fees.reduce((sum, fee) => {
    const feeAmount = parseFloat(fee.value.amount) / Math.pow(10, fee.value.decimals)
    return sum + feeAmount
  }, 0)

  // Calculate output amount
  const outputAmount = parseFloat(data.tokenAmountOut.amount) / Math.pow(10, data.tokenAmountOut.decimals)

  // Format as app route
  const appRoute: AppRoute = {
    id: 'symbiosis-base-ton',
    routeName: 'Symbiosis Bridge',
    provider: 'Bridge' as const,
    recipientGets: outputAmount,
    totalCost: amount,
    recipientCurrency: 'USDT', // TON receives USDT
    feeBreakdown: `Total Fees: $${totalFees.toFixed(2)}`,
    time: formatTime(data.estimatedTime),
    confidence: 'high',
    isBest: true,
    sourceCurrency: 'USDC', // Base USDbC (shown as USDC to users)
    destinationCurrency: 'USDT',
    steps: [
      {
        action: 'bridge',
        from: 'USDbC',
        to: 'USDT',
        provider: 'Symbiosis',
        cost: totalFees,
        time: formatTime(data.estimatedTime),
      },
    ],
    // Store raw Symbiosis data for execution
    // @ts-ignore
    rawSymbiosisData: data,
  }

  console.log('📊 Formatted route:', appRoute)

  return [appRoute]
}

/**
 * Format seconds to human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/**
 * Get approval address for Symbiosis bridge
 */
export function getSymbiosisApprovalAddress(): string {
  // This is the metaRouterGateway address for Base
  // Users need to approve USDbC spending to this address
  return '0x41Ae964d0F61Bb5F5e253141A462aD6F3b625B92'
}
