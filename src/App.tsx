/**
 * 🎯 WHY: App.tsx - Main Application Entry
 *
 * Phase 1: ✅ Real bridge aggregation (Li.Fi + CCTP)
 * Phase 2: ✅ Wallet connection + Transaction execution
 *
 * Wrapped with:
 * - TelegramProvider: Telegram SDK access
 * - WalletProvider: Wallet connection (Wagmi)
 */

import { TelegramProvider } from './providers/TelegramProvider'
import { WalletProvider } from './providers/WalletProvider'
import { QuoteScreen } from './screens/QuoteScreen'
import { TransactionScreen } from './screens/TransactionScreen'
import { useStore } from './store/useStore'

function App() {
  const { currentScreen } = useStore()

  return (
    <WalletProvider>
      <TelegramProvider>
        {currentScreen === 'transaction' ? <TransactionScreen /> : <QuoteScreen />}
      </TelegramProvider>
    </WalletProvider>
  )
}

export default App

/**
 * 🎓 WHAT YOU'VE BUILT:
 *
 * Phase 1: ✅ TypeScript + React + Vite foundation
 * Phase 2: ✅ Zustand state + Reusable UI components
 * Phase 3: ✅ Chat interface with AI integration
 * Phase 4: ✅ Connected to Flask backend (Li.Fi + CCTP)
 * Phase 4.5: ✅ Rebuilt with simpler form-based UI
 * Phase 5: ✅ Transaction execution with Li.Fi SDK
 *
 * Next: Polish & Testing!
 */
