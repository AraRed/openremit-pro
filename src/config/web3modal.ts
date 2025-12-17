/**
 * 🎯 WHY: Web3Modal Configuration
 *
 * NOTE: This file is currently disabled as Web3Modal is not being used.
 * The app uses a custom wallet connection UI instead.
 * To enable Web3Modal, install @web3modal/wagmi and uncomment the code below.
 */

// import { createWeb3Modal } from '@web3modal/wagmi'
// import { config } from './wagmi'

// /**
//  * Get WalletConnect Project ID from environment
//  */
// const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

// /**
//  * Create Web3Modal instance
//  * This provides professional wallet connection UI with:
//  * - QR codes for WalletConnect
//  * - Wallet icons and branding
//  * - Mobile deep links
//  */
// createWeb3Modal({
//   wagmiConfig: config,
//   projectId,
//   themeMode: 'light',
//   themeVariables: {
//     '--w3m-accent': '#3b82f6', // Blue accent color
//   }
// })

export {} // Make this a module
