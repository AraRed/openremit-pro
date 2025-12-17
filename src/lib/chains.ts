/**
 * Supported blockchain networks configuration
 */

export interface ChainInfo {
  chainId: number
  name: string
  shortName: string
  type: 'mainnet' | 'l2' | 'other'
  nativeCurrency: string
  rpcUrl?: string
  explorerUrl?: string
  // Address format: 'evm' for 0x..., 'ton' for UQ.../EQ...
  addressFormat: 'evm' | 'ton'
}

// Supported chains for bridging
export const CHAINS: Record<string, ChainInfo> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    type: 'mainnet',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    addressFormat: 'evm',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    type: 'l2',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://basescan.org',
    addressFormat: 'evm',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    type: 'l2',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    addressFormat: 'evm',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    type: 'l2',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    addressFormat: 'evm',
  },
  ton: {
    chainId: 607, // Li.Fi uses 607 for TON (need to verify)
    name: 'The Open Network',
    shortName: 'TON',
    type: 'other',
    nativeCurrency: 'TON',
    explorerUrl: 'https://tonscan.org',
    addressFormat: 'ton',
  },
}

// Helper to get chain by ID
export function getChainById(chainId: number): ChainInfo | undefined {
  return Object.values(CHAINS).find(chain => chain.chainId === chainId)
}

// Helper to get chain name
export function getChainName(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.shortName || `Chain ${chainId}`
}

// Validate address format for a chain
export function isValidAddressForChain(address: string, chainId: number): boolean {
  const chain = getChainById(chainId)
  if (!chain) return false

  if (chain.addressFormat === 'evm') {
    // EVM addresses: 0x + 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  } else if (chain.addressFormat === 'ton') {
    // TON addresses: UQ... or EQ... (48 characters base64)
    return /^[UE]Q[a-zA-Z0-9_-]{46}$/.test(address)
  }

  return false
}
