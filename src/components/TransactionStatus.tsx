import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import type { TransactionStatus as TxStatus } from '@/lib/types'

/**
 * Copy to clipboard button component
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
      title="Copy transaction hash"
    >
      {copied ? '✓ Copied!' : '📋 Copy'}
    </button>
  )
}

interface TransactionStatusProps {
  hash: string | null
  chainId: number
  status: TxStatus
  error?: string | null
}

/**
 * Helper to get block explorer URL for a transaction
 */
function getExplorerUrl(chainId: number, hash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
  }

  const baseUrl = explorers[chainId] || 'https://etherscan.io'
  return `${baseUrl}/tx/${hash}`
}

/**
 * Component to display transaction status with appropriate messaging and links
 */
export function TransactionStatus({ hash, chainId, status, error }: TransactionStatusProps) {
  // Trigger confetti on success
  useEffect(() => {
    if (status === 'success') {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [status])

  // Error state
  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">Transaction Failed</h3>
            <p className="mt-1 text-sm text-red-700">{error || 'An error occurred during the transaction'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Approving state
  if (status === 'approving') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏳</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">Approving USDC...</h3>
            <p className="mt-1 text-sm text-blue-700">Please confirm the approval transaction in your wallet</p>
          </div>
        </div>
      </div>
    )
  }

  // Executing state
  if (status === 'executing') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏳</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">Preparing Transaction...</h3>
            <p className="mt-1 text-sm text-blue-700">Building your bridge transaction</p>
          </div>
        </div>
      </div>
    )
  }

  // Pending confirmation
  if (status === 'pending' && hash) {
    const explorerUrl = getExplorerUrl(chainId, hash)

    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏳</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900">Confirming Transaction...</h3>
            <p className="mt-1 text-sm text-yellow-700">Your transaction is being processed on the blockchain</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
            >
              View on Block Explorer →
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success - bridging in progress
  if (status === 'success' && hash) {
    const explorerUrl = getExplorerUrl(chainId, hash)
    const lifiTrackerUrl = `https://jumper.exchange/tx/${hash}`

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">Transaction Sent!</h3>
            <p className="mt-1 text-sm text-green-700">Bridging in progress. This may take several minutes.</p>

            {/* Transaction Hash with Copy Button */}
            <div className="mt-2 flex items-center rounded bg-green-100 p-2">
              <code className="flex-1 overflow-hidden text-ellipsis text-xs text-green-900">
                {hash}
              </code>
              <CopyButton text={hash} />
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <a
                href={lifiTrackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
              >
                Track on Li.Fi Explorer →
              </a>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-800 underline hover:text-green-900"
              >
                View on Block Explorer →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Idle state
  return null
}
