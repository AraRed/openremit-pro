/**
 * 🎯 WHY: Connect Wallet - Clean Status Badge
 *
 * Shows a clean status badge in the header.
 * - Not connected: Shows nothing (clean header)
 * - Connected: Shows address badge with disconnect option
 */

import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '../ui'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Not connected: Show nothing (keeps header clean)
  if (!isConnected || !address) {
    return null
  }

  // Connected: Show clean status badge
  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-mono font-medium text-gray-900">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>

      {/* Disconnect Button */}
      <Button
        onClick={() => disconnect()}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        Disconnect
      </Button>
    </div>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Wagmi Hooks:
 *    - useAccount(): Get connected wallet address and connection status
 *    - useConnect(): Connect to a wallet (MetaMask, WalletConnect, etc.)
 *    - useDisconnect(): Disconnect from current wallet
 *
 * 2. Address Display:
 *    - Full addresses are long (0x1234...abcd)
 *    - We show first 6 and last 4 characters: 0x1234...abcd
 *    - font-mono for better readability
 *
 * 3. Connector Types:
 *    - Injected: Browser extension wallets (MetaMask, Coinbase)
 *    - WalletConnect: Mobile wallets via QR code
 *    - Each connector has a unique ID and name
 *
 * 💼 INTERVIEW TIP:
 * "I use Wagmi's hooks to manage wallet state. The hooks handle
 *  all the complexity: detecting wallets, switching accounts,
 *  and maintaining connection state across page refreshes."
 */
