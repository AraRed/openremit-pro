/**
 * 🎯 WHY: TypeScript needs to know about global Telegram object
 *
 * 💼 INTERVIEW: "Declaration files (.d.ts) provide type information
 *    for JavaScript libraries that don't have TypeScript types.
 *    This gives us autocomplete and type checking for external APIs."
 */

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  initDataUnsafe?: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  MainButton: {
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  BackButton: {
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
    getItem: (key: string, callback: (error: Error | null, value: string) => void) => void
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
  }
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
