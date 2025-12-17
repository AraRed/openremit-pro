/**
 * 🎯 WHY: Zustand for Global State Management
 *
 * 🔧 HOW:
 * - create() creates a React hook
 * - set() updates state (like setState)
 * - get() reads current state
 * - Components use this hook to access/modify state
 *
 * 💼 INTERVIEW: "I chose Zustand because it's:
 *    - Simpler than Redux (no actions/reducers boilerplate)
 *    - Type-safe with TypeScript
 *    - Performant (components only re-render on used state changes)
 *    - Small bundle size (1KB)"
 */

import { create } from 'zustand'
import type { AppState, UserInput, Route, WalletState, ChatMessage, Screen, TransactionStatus } from '@/lib/types'

/**
 * Main application store
 *
 * This is our "single source of truth" - all app state lives here.
 * Any component can read from or write to this store.
 */
export const useStore = create<AppState>((set, get) => ({
  // ===== STATE =====
  currentScreen: 'chat',
  userInput: null,
  routes: [],
  selectedRoute: null,
  isLoadingRoutes: false,
  wallet: {
    address: null,
    isConnected: false,
    chainId: null,
  },
  selectedToken: null,
  messages: [],

  // Transaction state
  transactionStatus: 'idle' as TransactionStatus,
  transactionHash: null,
  transactionError: null,
  approvalHash: null,

  // ===== ACTIONS =====

  /**
   * Navigate to different screen
   *
   * 💡 TIP: We could add transition animations here later
   */
  setCurrentScreen: (screen: Screen) => {
    set({ currentScreen: screen })

    // Add haptic feedback for Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
  },

  /**
   * Update user input (amount + country)
   */
  setUserInput: (input: UserInput) => {
    set({ userInput: input })
  },

  /**
   * Set available routes from AI
   */
  setRoutes: (routes: Route[]) => {
    set({ routes })
  },

  /**
   * User selects a route
   */
  setSelectedRoute: (route: Route | null) => {
    set({ selectedRoute: route })

    // Haptic feedback on selection
    if (window.Telegram?.WebApp && route) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged()
    }
  },

  /**
   * Loading state for route fetching
   */
  setIsLoadingRoutes: (loading: boolean) => {
    set({ isLoadingRoutes: loading })
  },

  /**
   * Update wallet connection state
   *
   * 💡 TIP: We use Partial<WalletState> so we can update
   *    just one property without touching others
   */
  setWallet: (wallet: Partial<WalletState>) => {
    set(state => ({
      wallet: { ...state.wallet, ...wallet }
    }))
  },

  /**
   * Set selected payment token (ETH, USDC, etc.)
   */
  setSelectedToken: (token: string | null) => {
    set({ selectedToken: token })
  },

  /**
   * Add a chat message
   *
   * 💡 TIP: We auto-generate id and timestamp
   */
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    set(state => ({
      messages: [...state.messages, newMessage]
    }))
  },

  /**
   * Set transaction status
   */
  setTransactionStatus: (status: TransactionStatus) => {
    set({ transactionStatus: status })
  },

  /**
   * Set transaction hash
   */
  setTransactionHash: (hash: string | null) => {
    set({ transactionHash: hash })
  },

  /**
   * Set transaction error
   */
  setTransactionError: (error: string | null) => {
    set({ transactionError: error })
  },

  /**
   * Set approval transaction hash
   */
  setApprovalHash: (hash: string | null) => {
    set({ approvalHash: hash })
  },

  /**
   * Reset transaction state
   */
  resetTransaction: () => {
    set({
      transactionStatus: 'idle' as TransactionStatus,
      transactionHash: null,
      transactionError: null,
      approvalHash: null,
    })
  },

  /**
   * Reset entire app state (useful for "Start Over")
   */
  reset: () => {
    set({
      currentScreen: 'chat',
      userInput: null,
      routes: [],
      selectedRoute: null,
      isLoadingRoutes: false,
      selectedToken: null,
      messages: [],
      // Don't reset wallet state (keep connection)
    })
  },
}))

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Zustand Pattern:
 *    - State properties (currentScreen, routes, etc.)
 *    - Action functions (setCurrentScreen, setRoutes, etc.)
 *    - All in one object returned by create()
 *
 * 2. set() function:
 *    - set({ key: value }) - Direct update
 *    - set(state => ({ ... })) - Update based on current state
 *
 * 3. Partial<T>:
 *    - TypeScript utility type
 *    - Makes all properties optional
 *    - Perfect for partial updates
 *
 * 4. Spread operator (...):
 *    - { ...state.wallet, ...wallet }
 *    - Merges objects (new values override old)
 *
 * 💼 INTERVIEW QUESTION: "Explain how Zustand works"
 * ANSWER: "Zustand creates a custom React hook using create().
 *          Components call this hook to access state and actions.
 *          When set() is called, Zustand notifies all subscribed
 *          components to re-render. It uses React context under
 *          the hood but with better performance through selective
 *          subscriptions."
 */
