/**
 * 🎯 WHY: App.tsx - Main Application Entry
 *
 * Phase 1: ✅ Real bridge aggregation (Li.Fi + CCTP)
 * Phase 2: 🚧 Telegram Mini App + @username support
 *
 * Wrapped with TelegramProvider for Telegram SDK access
 */

import { TelegramProvider } from './providers/TelegramProvider'
import { QuoteScreen } from './screens/QuoteScreen'

function App() {
  return (
    <TelegramProvider>
      <QuoteScreen />
    </TelegramProvider>
  )
}

export default App

/**
 * 🎓 WHAT YOU'VE BUILT:
 *
 * Phase 1: ✅ TypeScript + React + Vite foundation
 * Phase 2: ✅ Zustand state + Reusable UI components
 * Phase 3: ✅ Chat interface with AI integration
 * Phase 4: ✅ Connected to Flask AI backend
 * Phase 4.5: ✅ Rebuilt with simpler form-based UI
 *
 * Next: Build route comparison cards!
 */
