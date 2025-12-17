/**
 * 🎯 WHY: Wagmi Configuration
 *
 * Shared Wagmi configuration for wallet connections.
 * Optimized for mobile/Telegram users with multiple wallet options:
 * - Coinbase Smart Wallet (Passkey/FaceID - best for mobile)
 * - MetaMask, Brave, and other browser wallets
 * - WalletConnect (QR code for Robinhood, Trust Wallet, etc.)
 */

import { createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum, optimism } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

/**
 * Get WalletConnect Project ID from environment
 */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

/**
 * Configure supported chains
 * MVP: Ethereum (source) → Base/Arbitrum/Optimism (destinations)
 */
export const config = createConfig({
  chains: [mainnet, base, arbitrum, optimism],
  connectors: [
    // Coinbase Smart Wallet - Passkey/FaceID flow (best for Telegram Mini App)
    coinbaseWallet({
      appName: 'OpenRemit',
      preference: 'smartWalletOnly', // Forces new Passkey flow, not extension
    }),
    // MetaMask, Brave Wallet, other injected wallets
    injected(),
    // WalletConnect - QR code for Robinhood, Trust Wallet, etc.
    walletConnect({
      projectId,
      metadata: {
        name: 'OpenRemit',
        description: 'Bridge USDC across chains with the best rates',
        url: 'https://openremit.app',
        icons: ['https://openremit.app/icon.png']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
})
