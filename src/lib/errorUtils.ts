/**
 * Sanitizes technical error messages into user-friendly text
 * Prevents showing raw JSON-RPC errors, stack traces, or technical details
 */
export function sanitizeErrorMessage(error: any): string {
  const errorMessage = error?.message || error?.toString() || 'Unknown error'

  // User rejected transaction
  if (
    error?.code === 4001 ||
    errorMessage.toLowerCase().includes('user rejected') ||
    errorMessage.toLowerCase().includes('user denied')
  ) {
    return 'Transaction cancelled'
  }

  // Insufficient funds for gas
  if (
    errorMessage.toLowerCase().includes('insufficient funds') ||
    errorMessage.toLowerCase().includes('insufficient balance')
  ) {
    return 'Insufficient funds for gas fees'
  }

  // Network/RPC errors
  if (
    error?.code === -32603 ||
    errorMessage.toLowerCase().includes('rpc') ||
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('provider')
  ) {
    return 'Network busy, please try again'
  }

  // Request expired (Symbiosis specific)
  if (errorMessage.toLowerCase().includes('request expired')) {
    return 'Quote expired, please try again'
  }

  // Transaction reverted
  if (errorMessage.toLowerCase().includes('revert')) {
    return 'Transaction failed, please check your balance and try again'
  }

  // Generic fallback - don't expose technical details
  return 'Something went wrong, please try again'
}
