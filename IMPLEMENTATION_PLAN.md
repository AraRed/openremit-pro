# Phase 3: Transaction Execution - Implementation Plan

## Overview
Enable actual USDC bridge transactions using Li.Fi SDK with proper approval flow, network switching, and transaction tracking.

## User Requirements (Clarified)
1. **Li.Fi SDK**: Use `@lifi/sdk` - automatically handles approvals, transaction building, and chain switching logic
2. **Transaction Tracking**: Track until "Bridging" state, then provide link to Li.Fi Explorer (don't make users wait 20 minutes)
3. **Network Switching**: Auto-switch with wallet prompt when user is on wrong network

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @lifi/sdk
```

**Why**: Li.Fi SDK provides smart wrapper for cross-chain transactions, handling approvals and transaction building automatically.

### Step 2: Create Contract Constants
**File**: `src/lib/contracts.ts`

```typescript
// USDC addresses per chain
export const USDC_ADDRESSES = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" // Optimism
}

// Minimal ERC20 ABI for balance and approval
export const ERC20_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

**Why**: Centralized constants prevent typos and make chain additions easy.

### Step 3: Initialize Li.Fi SDK Client
**File**: `src/lib/lifi.ts`

```typescript
import { LiFi, ChainId, RouteOptions } from '@lifi/sdk'

export const lifi = new LiFi({
  integrator: 'OpenRemit', // Your app name for Li.Fi analytics
})

// Helper to get execution parameters from route
export async function getExecutionData(
  fromChainId: ChainId,
  toChainId: ChainId,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  fromAddress: string
) {
  const routeOptions: RouteOptions = {
    fromChainId,
    toChainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount,
    fromAddress,
    slippage: 0.03, // 3% slippage
  }

  const routes = await lifi.getRoutes(routeOptions)
  return routes.routes[0] // Return best route
}
```

**Why**: Li.Fi SDK handles all bridge protocol integrations and automatically selects best route.

### Step 4: Add Transaction State to Zustand Store
**File**: `src/store/useStore.ts` (modify)

Add to AppState interface:
```typescript
// Transaction state
transactionStatus: 'idle' | 'approving' | 'executing' | 'pending' | 'success' | 'error'
transactionHash: string | null
transactionError: string | null
approvalHash: string | null
```

Add actions:
```typescript
setTransactionStatus: (status) => set({ transactionStatus: status })
setTransactionHash: (hash) => set({ transactionHash: hash })
setTransactionError: (error) => set({ transactionError: error })
setApprovalHash: (hash) => set({ approvalHash: hash })
resetTransaction: () => set({
  transactionStatus: 'idle',
  transactionHash: null,
  transactionError: null,
  approvalHash: null
})
```

**Why**: Centralized state makes transaction status accessible across components.

### Step 5: Create Transaction Types
**File**: `src/lib/types.ts` (modify)

Add:
```typescript
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
  amount: string
  fromAddress: string
}
```

**Why**: Type safety prevents runtime errors.

### Step 6: Create Balance Check Hook
**File**: `src/hooks/useTokenBalance.ts`

```typescript
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { USDC_ADDRESSES, ERC20_ABI } from '@/lib/contracts'

export function useTokenBalance(chainId?: number, address?: string) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: chainId ? USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES] : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
  })

  return {
    balance: balance ? formatUnits(balance as bigint, 6) : '0',
    balanceWei: balance as bigint,
    isLoading,
    refetch,
  }
}
```

**Why**: Reusable hook for checking USDC balance across chains.

### Step 7: Create Approval Hook
**File**: `src/hooks/useTokenApproval.ts`

```typescript
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { USDC_ADDRESSES, ERC20_ABI } from '@/lib/contracts'
import { useStore } from '@/store/useStore'

export function useTokenApproval(
  chainId: number,
  spender: string,
  amount: bigint
) {
  const setApprovalHash = useStore(state => state.setApprovalHash)

  // Check current allowance
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [/* owner address */, spender],
    chainId,
  })

  // Approval transaction
  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async () => {
    const result = await writeContract({
      address: USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES],
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
      chainId,
    })
    setApprovalHash(result)
  }

  const needsApproval = allowance ? (allowance as bigint) < amount : true

  return {
    approve,
    isApproving: isConfirming,
    needsApproval,
    approvalHash: hash,
  }
}
```

**Why**: Li.Fi SDK will tell us if approval is needed; this hook executes it.

### Step 8: Create Bridge Transaction Hook
**File**: `src/hooks/useBridgeTransaction.ts`

```typescript
import { useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { useStore } from '@/store/useStore'
import { lifi, getExecutionData } from '@/lib/lifi'
import { parseUnits } from 'viem'

export function useBridgeTransaction() {
  const setTransactionStatus = useStore(state => state.setTransactionStatus)
  const setTransactionHash = useStore(state => state.setTransactionHash)
  const setTransactionError = useStore(state => state.setTransactionError)

  const { sendTransaction, data: hash } = useSendTransaction()
  const { switchChain } = useSwitchChain()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      setTransactionStatus('success')
    },
  })

  const executeBridge = async (params: BridgeParams) => {
    try {
      setTransactionStatus('executing')

      // Auto-switch network if needed
      if (window.ethereum?.chainId !== params.fromChainId) {
        await switchChain({ chainId: params.fromChainId })
      }

      // Get execution data from Li.Fi SDK
      const route = await getExecutionData(
        params.fromChainId,
        params.toChainId,
        USDC_ADDRESSES[params.fromChainId],
        USDC_ADDRESSES[params.toChainId],
        parseUnits(params.amount, 6).toString(),
        params.fromAddress
      )

      // Execute first step (Li.Fi SDK handles multi-step routes)
      const tx = route.steps[0].transactionRequest

      const txHash = await sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId: params.fromChainId,
      })

      setTransactionHash(txHash)
      setTransactionStatus('pending')

    } catch (error) {
      setTransactionError(error.message)
      setTransactionStatus('error')
    }
  }

  return {
    executeBridge,
    isExecuting: isConfirming,
    transactionHash: hash,
  }
}
```

**Why**: Encapsulates complex bridge logic with Li.Fi SDK integration.

### Step 9: Create Transaction Screen
**File**: `src/screens/TransactionScreen.tsx`

Main UI flow:
1. **Pre-flight Checks Section**
   - ✅ Network: Ethereum Mainnet
   - ✅ Balance: 500.00 USDC
   - ✅ Gas: ~$2.50

2. **Approval Section** (if needed)
   - Button: "Approve USDC" → Wait for confirmation
   - Show approval transaction hash with Etherscan link

3. **Execute Section**
   - Button: "Send Transfer" → Execute bridge
   - Disabled until approval completes

4. **Status Display**
   - Pending: "Confirming transaction..."
   - Success: "Bridging in progress! Track on Li.Fi Explorer"
   - Link to: `https://jumper.exchange/tx/{hash}`

**Why**: Clear step-by-step UI reduces user anxiety.

### Step 10: Create Transaction Status Component
**File**: `src/components/TransactionStatus.tsx`

```typescript
export function TransactionStatus({ hash, chainId, status }) {
  const explorerUrl = getExplorerUrl(chainId, hash)
  const lifiTrackerUrl = `https://jumper.exchange/tx/${hash}`

  if (status === 'pending') {
    return (
      <div>
        <Loader /> Confirming transaction...
        <a href={explorerUrl}>View on Etherscan</a>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div>
        ✅ Transaction Sent! Bridging in progress...
        <a href={lifiTrackerUrl}>Track on Li.Fi Explorer</a>
        <a href={explorerUrl}>View on Etherscan</a>
      </div>
    )
  }

  // ... error state
}
```

**Why**: Separates status display logic for reusability.

### Step 11: Update Route Comparison Screen
**File**: `src/screens/RouteComparisonScreen.tsx` (modify)

Change button logic:
```typescript
{wallet.isConnected ? (
  <Button onClick={() => setCurrentScreen('transaction')}>
    Execute Transfer
  </Button>
) : (
  <Button onClick={openConnectModal}>
    Connect Wallet
  </Button>
)}
```

**Why**: Direct path to transaction execution when wallet connected.

### Step 12: Add Transaction Screen to App Router
**File**: `src/App.tsx` (modify)

Add case:
```typescript
{currentScreen === 'transaction' && <TransactionScreen />}
```

**Why**: Make transaction screen accessible in navigation flow.

## Error Handling

1. **Insufficient Balance**: Show error before approval
2. **Network Mismatch**: Auto-switch with user prompt
3. **Approval Failed**: Show error, allow retry
4. **Transaction Failed**: Show error with details, allow retry
5. **User Rejected**: Reset to idle state

## Testing Checklist

- [ ] Balance check works on all supported chains
- [ ] Approval flow triggers when needed
- [ ] Approval flow skips when not needed
- [ ] Network switching prompts correctly
- [ ] Transaction executes successfully
- [ ] Transaction hash displays correctly
- [ ] Li.Fi Explorer link works
- [ ] Error states display properly
- [ ] Can retry after errors
- [ ] Success state shows correctly

## Files Modified
1. `src/store/useStore.ts` - Add transaction state
2. `src/lib/types.ts` - Add transaction types
3. `src/screens/RouteComparisonScreen.tsx` - Update CTA button
4. `src/App.tsx` - Add transaction screen route

## Files Created
1. `src/lib/contracts.ts` - USDC addresses and ABIs
2. `src/lib/lifi.ts` - Li.Fi SDK client
3. `src/hooks/useTokenBalance.ts` - Balance checking
4. `src/hooks/useTokenApproval.ts` - Approval handling
5. `src/hooks/useBridgeTransaction.ts` - Bridge execution
6. `src/screens/TransactionScreen.tsx` - Main execution UI
7. `src/components/TransactionStatus.tsx` - Status display

## Dependencies to Install
- `@lifi/sdk` - Li.Fi SDK for cross-chain transactions

## Success Criteria
✅ User can execute USDC bridge from Ethereum to L2
✅ Approval flow works correctly
✅ Network switching prompts automatically
✅ Transaction tracking links to Li.Fi Explorer
✅ All error states handled gracefully
✅ No private keys or sensitive data exposed
