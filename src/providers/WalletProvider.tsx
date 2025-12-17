/**
 * 🎯 WHY: Wallet Provider for Phase 2
 *
 * Manages wallet connection state using Wagmi (industry standard for EVM chains).
 * Supports MetaMask, WalletConnect, and other EVM wallets.
 * Uses Web3Modal for professional wallet connection UI with QR codes.
 */

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'

// React Query client for Wagmi
const queryClient = new QueryClient()

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Wagmi Configuration:
 *    - chains: Networks your app supports
 *    - connectors: Ways to connect (MetaMask, WalletConnect, etc.)
 *    - transports: RPC endpoints (http() uses public RPCs)
 *
 * 2. WalletConnect:
 *    - Allows mobile wallet connection via QR code
 *    - Requires a project ID (get free at cloud.walletconnect.com)
 *    - For MVP, we use 'demo' which has rate limits
 *
 * 3. React Query:
 *    - Wagmi uses React Query for caching/state management
 *    - Automatically refetches balances, transactions, etc.
 *
 * 💼 INTERVIEW TIP:
 * "I chose Wagmi because it's the industry standard for Web3 React apps.
 *  It abstracts away the complexity of wallet connections, switching chains,
 *  and transaction signing while maintaining type safety."
 */
