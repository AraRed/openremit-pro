/**
 * 🎯 WHY: TypeScript interfaces define the "shape" of our data
 *
 * 💼 INTERVIEW: "I use interfaces to define data contracts. This provides:
 *    - Type safety (catch bugs at compile time)
 *    - Self-documentation (clear what data looks like)
 *    - Autocomplete in IDE
 *    - Refactoring safety (TypeScript updates all usages)"
 */

// ===== CURRENCIES =====
// Source: Crypto only (Telegram users have crypto wallets)
export type SourceCurrency = 'ETH' | 'BTC' | 'USDC' | 'USDT'
// Destination: Crypto + Fiat (recipient can receive either)
export type DestinationCurrency = 'USD' | 'BRL' | 'NGN' | 'ETH' | 'BTC' | 'USDC' | 'USDT'

export interface CurrencyInfo {
  code: SourceCurrency | DestinationCurrency
  name: string
  type: 'fiat' | 'crypto'
  icon: string
}

// ===== USER INPUT =====
export interface UserInput {
  amount: number
  sourceCurrency: SourceCurrency
  destinationCurrency: DestinationCurrency
  country?: string // Optional - only needed for fiat destinations
  fromChainId?: number // Source chain (e.g., 1 for Ethereum, 8453 for Base)
  toChainId?: number // Destination chain (e.g., 8453 for Base, TON chain ID for TON)
  recipient?: string // Recipient wallet address (0x... for EVM, UQ.../EQ... for TON)
}

// ===== ROUTES =====
export interface RouteStep {
  action: 'buy' | 'swap' | 'bridge' | 'transfer' | 'sell'
  from: string
  to: string
  provider: string
  cost: number
  time: string
}

export interface Route {
  id: string
  routeName: string
  isBest: boolean
  totalCost: number
  recipientGets: number
  recipientCurrency: string
  feeBreakdown: string
  time: string
  provider?: 'Lightning' | 'Stellar' | 'Bridge' | 'Stablecoin'
  confidence?: 'high' | 'medium' | 'low'

  // NEW: Multi-currency support
  sourceCurrency?: SourceCurrency
  destinationCurrency?: DestinationCurrency
  steps?: RouteStep[] // Multi-step routes (e.g., USD → USDC → BRL)
}

export interface RouteResponse {
  status: 'OK' | 'ERROR'
  routes: Route[]
  message?: string
}

// ===== CHAT =====
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface QuickReply {
  text: string
  value: string | number
}

// ===== WALLET =====
export interface WalletState {
  address: string | null
  isConnected: boolean
  chainId: number | null
}

export interface TokenBalance {
  symbol: string
  balance: string
  balanceUSD: number
  decimals: number
}

// ===== APP STATE =====
export type Screen = 'chat' | 'routes' | 'payment' | 'confirmation' | 'status' | 'transaction'

export interface AppState {
  // Current screen
  currentScreen: Screen

  // User input
  userInput: UserInput | null

  // Routes
  routes: Route[]
  selectedRoute: Route | null
  isLoadingRoutes: boolean

  // Wallet
  wallet: WalletState
  selectedToken: string | null

  // Chat
  messages: ChatMessage[]

  // Transaction
  transactionStatus: TransactionStatus
  transactionHash: string | null
  transactionError: string | null
  approvalHash: string | null

  // Actions
  setCurrentScreen: (screen: Screen) => void
  setUserInput: (input: UserInput) => void
  setRoutes: (routes: Route[]) => void
  setSelectedRoute: (route: Route | null) => void
  setIsLoadingRoutes: (loading: boolean) => void
  setWallet: (wallet: Partial<WalletState>) => void
  setSelectedToken: (token: string | null) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setTransactionStatus: (status: TransactionStatus) => void
  setTransactionHash: (hash: string | null) => void
  setTransactionError: (error: string | null) => void
  setApprovalHash: (hash: string | null) => void
  resetTransaction: () => void
  reset: () => void
}

// ===== API =====
export interface APIQuoteRequest {
  sendAmount: number
  sourceCurrency: SourceCurrency
  destinationCurrency: DestinationCurrency
  country?: string // Optional - only needed for fiat destinations
}

export interface APIQuoteResponse {
  status: 'OK' | 'UNSUPPORTED' | 'ERROR'
  routes?: Route[]
  error?: string
  message?: string
}

// ===== TRANSACTIONS =====
export type TransactionStatus = 'idle' | 'approving' | 'executing' | 'pending' | 'success' | 'error'

export interface TransactionState {
  status: TransactionStatus
  hash: string | null
  error: string | null
  approvalHash: string | null
}

export interface BridgeParams {
  route: Route
  fromChainId: number
  toChainId: number
  amount: string // Amount in USDC (e.g., "500" for 500 USDC)
  fromAddress: string
  toAddress?: string // Recipient address (defaults to fromAddress if not provided)
}
