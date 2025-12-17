import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { getUSDCAddress, ERC20_ABI } from '@/lib/contracts'
import { useStore } from '@/store/useStore'

/**
 * Hook to handle USDC approval for bridge contract
 *
 * @param chainId - The chain ID where approval is needed
 * @param spender - The address that needs approval (bridge contract)
 * @param amount - The amount to approve (in wei)
 * @returns Approval state and functions
 */
export function useTokenApproval(chainId: number, spender: string, amount: bigint) {
  const { address } = useAccount()
  const setApprovalHash = useStore((state) => state.setApprovalHash)
  const setTransactionStatus = useStore((state) => state.setTransactionStatus)

  const usdcAddress = getUSDCAddress(chainId)

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spender ? [address, spender as `0x${string}`] : undefined,
    chainId,
    query: {
      enabled: !!usdcAddress && !!address && !!spender,
    },
  })

  // Approval transaction
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async () => {
    if (!usdcAddress) {
      throw new Error('USDC address not found for this chain')
    }

    // 🔥 VALIDATION: Prevent approving zero address
    if (!spender || spender === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid spender address - cannot approve zero address')
    }

    console.log('🔍 Approval details:', {
      usdcAddress,
      spender,
      amount: amount.toString(),
      chainId,
    })

    try {
      setTransactionStatus('approving')

      // 🔥 STEP 1: Send the approval transaction
      const txHash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
        chainId,
      })

      setApprovalHash(txHash)
      console.log('✅ Approval transaction sent:', txHash)

      // 🔥 STEP 2: Return the hash so caller can wait for confirmation
      // The useWaitForTransactionReceipt hook will handle waiting
      return txHash
    } catch (error) {
      setTransactionStatus('error')
      throw error
    }
  }

  // Check if approval is needed
  const currentAllowance = (allowance as bigint) || BigInt(0)
  const needsApproval = currentAllowance < amount

  return {
    approve,
    isApproving: isPending || isConfirming,
    isApproved: isConfirmed,
    needsApproval,
    approvalHash: hash,
    refetchAllowance,
  }
}
