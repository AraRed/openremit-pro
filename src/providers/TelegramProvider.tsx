/**
 * 🎯 WHY: Telegram Mini App Provider
 *
 * Wraps the app with Telegram SDK context, providing access to:
 * - User data (username, ID, photo)
 * - Theme and UI customization
 * - Telegram-specific features (haptics, sharing, etc.)
 *
 * Uses official @tma.js/sdk-react for React integration
 */

import { type FC, type PropsWithChildren } from 'react'


/**
 * Telegram SDK Provider
 *
 * Simple wrapper that detects Telegram environment
 * For now, just renders children - full SDK integration will be added when deploying to Telegram
 */
export const TelegramProvider: FC<PropsWithChildren> = ({ children }) => {
  // Check if running in Telegram environment
  const isTelegramEnv = typeof window !== 'undefined' && window.Telegram?.WebApp

  if (isTelegramEnv) {
    console.log('✅ Running in Telegram environment')
    // Initialize basic Telegram WebApp
    window.Telegram?.WebApp.ready()
    window.Telegram?.WebApp.expand()
  } else {
    console.log('⚠️ Not running in Telegram - using standard web mode')
  }

  // Just render children for now
  return <>{children}</>
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. SDKProvider:
 *    - Root component that initializes Telegram SDK
 *    - acceptCustomStyles: Allows custom CSS
 *    - debug: Shows logs in development
 *
 * 2. Launch Params:
 *    - Platform: ios, android, web
 *    - Start param: Deep link parameter (e.g., "transfer_to_user123")
 *    - Used for routing and analytics
 *
 * 3. Theme Integration:
 *    - Automatically syncs with Telegram's dark/light mode
 *    - CSS variables available: var(--tg-theme-bg-color), etc.
 *
 * 4. Viewport:
 *    - Controls app height and expansion
 *    - viewport.expand() makes app full screen
 *
 * 💼 INTERVIEW TIP: "I use provider pattern to inject dependencies
 *    and share context across the app without prop drilling.
 *    This keeps components clean and testable."
 */
