/**
 * 🎯 WHY: TON DNS Resolver
 *
 * Resolves Telegram usernames to TON wallet addresses
 * Supports:
 * - @username → username.ton → wallet address
 * - Direct .ton domain resolution
 *
 * Uses TON SDK to query DNS smart contracts on-chain
 */

import { Address } from 'ton-core'
import { TonClient } from 'ton'

// TON mainnet endpoint (public API)
const TON_ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC'

// Initialize TON client (lazy initialization)
let tonClient: TonClient | null = null

function getTonClient(): TonClient {
  if (!tonClient) {
    tonClient = new TonClient({
      endpoint: TON_ENDPOINT,
    })
  }
  return tonClient
}

/**
 * Resolve a .ton domain to a wallet address
 *
 * @param domain - e.g., "alice.ton"
 * @returns Wallet address or null if not found
 */
export async function resolveTonDomain(domain: string): Promise<string | null> {
  try {
    // const client = getTonClient() // TODO: Use for production DNS contract calls

    // TON DNS resolution via TON Center API
    // Note: This is a simplified version. Production would use DNS contract calls.
    const response = await fetch(
      `${TON_ENDPOINT}?method=dnsResolve&domain=${domain}`
    )

    const data = await response.json()

    if (data.ok && data.result?.wallet) {
      // Convert to user-friendly address format
      const address = Address.parse(data.result.wallet)
      return address.toString({ bounceable: true, urlSafe: true })
    }

    return null
  } catch (error) {
    console.error('❌ TON DNS resolution failed:', error)
    return null
  }
}

/**
 * Resolve Telegram username to wallet address
 *
 * Converts @username → username.ton → wallet address
 *
 * @param username - e.g., "@alice" or "alice"
 * @returns Wallet address or null
 */
export async function resolveUsername(username: string): Promise<string | null> {
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '')

  // Convert to .ton domain
  const tonDomain = `${cleanUsername}.ton`

  return resolveTonDomain(tonDomain)
}

/**
 * Validate if a string is a valid TON address
 *
 * @param address - Potential TON address
 * @returns true if valid
 */
export function isValidTonAddress(address: string): boolean {
  try {
    Address.parse(address)
    return true
  } catch {
    return false
  }
}

/**
 * Format TON address for display (shortened)
 *
 * @param address - Full TON address
 * @returns Shortened format: UQAb...xyz
 */
export function formatTonAddress(address: string): string {
  if (address.length < 10) return address

  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. TON DNS System:
 *    - Similar to ENS (Ethereum Name Service)
 *    - Domains are NFTs stored on-chain
 *    - username.ton → wallet address mapping
 *
 * 2. Lazy Initialization:
 *    - getTonClient() creates client only when needed
 *    - Saves resources if DNS is never used
 *    - Singleton pattern (one instance shared)
 *
 * 3. Address Formats:
 *    - Bounceable: For smart contracts (recommended)
 *    - Non-bounceable: For regular wallets
 *    - URL-safe: Base64 encoding safe for URLs
 *
 * 4. Error Handling:
 *    - Try/catch for network errors
 *    - Return null instead of throwing
 *    - Graceful degradation
 *
 * 💼 INTERVIEW QUESTION: "How do you handle async operations?"
 * ANSWER: "I use async/await for readability, wrap in try/catch
 *          for error handling, and return null for failed lookups
 *          instead of throwing, allowing the UI to gracefully
 *          handle missing data."
 *
 * 🚧 PRODUCTION NOTE:
 * This is a simplified version using TON Center API.
 * Production should:
 * - Use DNS contract calls directly via TonClient
 * - Cache DNS resolutions (15 min TTL)
 * - Handle rate limits
 * - Support custom RPC endpoints
 */
