/**
 * Telegram WebApp Types
 * Adds TypeScript support for window.Telegram
 */

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
    }
  }
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
