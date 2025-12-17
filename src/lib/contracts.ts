// USDC token addresses per chain
export const USDC_ADDRESSES = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet - USDC
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base - Native USDC (most common)
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum - USDC
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism - USDC
} as const

// Minimal ERC20 ABI for balance, allowance, and approval
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Helper to get USDC address for a chain
export function getUSDCAddress(chainId: number): `0x${string}` | undefined {
  return USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES]
}
