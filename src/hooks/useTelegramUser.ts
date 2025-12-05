/**
 * 🎯 WHY: Telegram User Hook
 *
 * Provides easy access to Telegram user data
 * Returns user info, username, and helper functions
 *
 * NOTE: Disabled for local development, will be enabled for Telegram deployment
 */

// import { useInitData } from '@tma.js/sdk-react'

export interface TelegramUser {
  id: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  isPremium?: boolean
  photoUrl?: string
}

export function useTelegramUser() {
  // TODO: Re-enable for Telegram deployment
  // const initData = useInitData()
  // const user = initData?.user

  // Disabled for local development
  return {
    user: null,
    isTelegramEnv: false,
    displayName: 'Guest',
    fullName: 'Guest',
    username: undefined,
  }
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. useInitData Hook:
 *    - Provided by @tma.js/sdk-react
 *    - Contains all initialization data from Telegram
 *    - Includes user, chat, startParam, etc.
 *
 * 2. Optional Chaining (?.):
 *    - Safely access nested properties
 *    - Returns undefined if any level is null/undefined
 *    - Prevents "Cannot read property of undefined" errors
 *
 * 3. Nullish Coalescing (??):
 *    - Returns right side if left is null/undefined
 *    - user?.username ?? 'Guest' → 'Guest' if no username
 *
 * 4. Type Safety:
 *    - TelegramUser interface ensures consistent data shape
 *    - TypeScript catches errors at compile time
 *
 * 💼 INTERVIEW TIP: "Custom hooks encapsulate reusable logic.
 *    This hook abstracts Telegram user access, making it
 *    easy to use across components without duplicating code."
 */
