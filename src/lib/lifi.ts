import { getRoutes, createConfig } from '@lifi/sdk'
import type { Route, RoutesRequest } from '@lifi/types'
import { getUSDCAddress } from './contracts'
import type { Route as AppRoute } from './types'

// Configure Li.Fi SDK
createConfig({
  integrator: 'OpenRemit', // Your app name for Li.Fi analytics
})

/**
 * 🔧 Get real quotes from Li.Fi SDK
 * Returns formatted route data for UI display
 */
export async function getLiFiQuote(
  fromChainId: number,
  toChainId: number,
  amount: number, // Amount in USDC (e.g., 500 for 500 USDC)
  fromAddress: string,
  toAddress?: string
): Promise<AppRoute[]> {
  console.log('🔍 Fetching Li.Fi quotes...', {
    fromChainId,
    toChainId,
    amount,
    fromAddress,
    toAddress,
  })

  // Check for TON bridging (currently not supported via Li.Fi)
  if (toChainId === 607) {
    throw new Error('TON bridging is coming soon! Li.Fi currently only supports EVM chains. For now, please select an EVM destination chain (Base, Optimism, Arbitrum, or Ethereum).')
  }

  const fromToken = getUSDCAddress(fromChainId)
  const toToken = getUSDCAddress(toChainId)

  if (!fromToken) {
    throw new Error(`USDC not supported on source chain ${fromChainId}. Supported chains: Base, Optimism, Arbitrum, Ethereum.`)
  }

  if (!toToken) {
    throw new Error(`USDC not supported on destination chain ${toChainId}. Supported chains: Base, Optimism, Arbitrum, Ethereum.`)
  }

  // Convert amount to wei (USDC has 6 decimals)
  const amountWei = (amount * 1_000_000).toString()

  const routeRequest: RoutesRequest = {
    fromChainId,
    toChainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount: amountWei,
    fromAddress,
    toAddress: toAddress || fromAddress,
    options: {
      slippage: 0.03, // 3% slippage tolerance
      order: 'FASTEST', // Prioritize speed
    },
  }

  const result = await getRoutes(routeRequest)

  if (!result.routes || result.routes.length === 0) {
    throw new Error('No routes found between these chains')
  }

  console.log(`✅ Found ${result.routes.length} routes from Li.Fi`, result.routes)

  // Transform Li.Fi routes to our app format
  const appRoutes: AppRoute[] = result.routes.slice(0, 3).map((route, index) => {
    const estimatedTime = route.steps.reduce((total, step) => {
      return total + (step.estimate.executionDuration || 0)
    }, 0)

    const gasCostUSD = route.gasCostUSD ? parseFloat(route.gasCostUSD) : 0
    const feeAmount = route.steps.reduce((total, step) => {
      return total + (step.estimate.feeCosts?.reduce((sum, fee) => sum + parseFloat(fee.amountUSD || '0'), 0) || 0)
    }, 0)

    const totalFees = gasCostUSD + feeAmount
    const outputAmount = parseFloat(route.toAmountUSD || '0')
    const inputAmount = parseFloat(route.fromAmountUSD || '0')

    const toolName = route.steps[0]?.tool || 'Bridge'

    return {
      id: route.id || `route-${index}`,
      routeName: `${toolName} Bridge`,
      provider: 'Bridge' as const,
      recipientGets: outputAmount,
      totalCost: inputAmount,
      recipientCurrency: 'USDC',
      feeBreakdown: `Gas: $${gasCostUSD.toFixed(2)} + Bridge: $${feeAmount.toFixed(2)}`,
      time: formatTime(estimatedTime),
      confidence: index === 0 ? 'high' : 'medium',
      isBest: index === 0,
      sourceCurrency: 'USDC',
      destinationCurrency: 'USDC',
      steps: route.steps.map((step) => ({
        action: step.type.toLowerCase() as any,
        from: step.action.fromToken.symbol,
        to: step.action.toToken.symbol,
        provider: step.tool,
        cost: parseFloat(step.estimate.gasCosts?.[0]?.amountUSD || '0'),
        time: formatTime(step.estimate.executionDuration || 0),
      })),
      // @ts-ignore - Store raw Li.Fi route for execution
      rawRoute: route,
    }
  })

  return appRoutes
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

// Helper to get execution route from Li.Fi SDK
export async function getExecutionRoute(
  fromChainId: number,
  toChainId: number,
  fromAmount: string, // Amount in wei (USDC has 6 decimals)
  fromAddress: string,
  toAddress?: string // Optional recipient address (defaults to fromAddress)
): Promise<Route> {
  const fromToken = getUSDCAddress(fromChainId)
  const toToken = getUSDCAddress(toChainId)

  if (!fromToken || !toToken) {
    throw new Error('USDC not supported on specified chain')
  }

  const routeRequest: RoutesRequest = {
    fromChainId,
    toChainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount,
    fromAddress,
    toAddress: toAddress || fromAddress, // Use recipient if provided, otherwise send to self
    options: {
      slippage: 0.03, // 3% slippage tolerance
    },
  }

  const result = await getRoutes(routeRequest)

  if (!result.routes || result.routes.length === 0) {
    throw new Error('No routes found')
  }

  const bestRoute = result.routes[0]
  if (!bestRoute) {
    throw new Error('No routes found')
  }

  return bestRoute // Return best route
}
