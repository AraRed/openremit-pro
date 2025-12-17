/**
 * Network Icon Component
 * Renders official network logos as SVGs
 */

interface NetworkIconProps {
  chainId: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function NetworkIcon({ chainId, size = 'md', className = '' }: NetworkIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const sizeClass = sizeClasses[size]

  // Ethereum Logo
  if (chainId === 1) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <svg viewBox="0 0 256 417" className="w-full h-full">
          <path fill="#343434" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
          <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
          <path fill="#3C3C3B" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
          <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z"/>
          <path fill="#141414" d="M127.961 287.958l127.96-75.637-127.96-58.162z"/>
          <path fill="#393939" d="M0 212.32l127.96 75.638v-133.8z"/>
        </svg>
      </div>
    )
  }

  // Base Logo
  if (chainId === 8453) {
    return (
      <div className={`${sizeClass} ${className} rounded-full bg-blue-600 flex items-center justify-center p-1.5`}>
        <svg viewBox="0 0 111 111" fill="none" className="w-full h-full">
          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="white"/>
        </svg>
      </div>
    )
  }

  // Arbitrum Logo
  if (chainId === 42161) {
    return (
      <div className={`${sizeClass} ${className} rounded-full bg-blue-400 flex items-center justify-center p-1.5`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z" fill="#213147"/>
          <path d="M22.34 20.63l-3.68-6.37a.625.625 0 00-1.08 0l-1.85 3.2-3.68-6.37a.625.625 0 00-1.08 0l-5 8.66a.625.625 0 00.54.94h4.38c.22 0 .42-.11.54-.3l1.85-3.2 3.68 6.37c.11.19.32.3.54.3h4.38a.625.625 0 00.54-.94l-1.85-3.2z" fill="#28A0F0"/>
          <path d="M20.49 20.63l-1.85-3.2a.625.625 0 00-1.08 0l-1.85 3.2a.625.625 0 00.54.94h3.7a.625.625 0 00.54-.94z" fill="#96BEDC"/>
        </svg>
      </div>
    )
  }

  // Optimism Logo
  if (chainId === 10) {
    return (
      <div className={`${sizeClass} ${className} rounded-full bg-red-500 flex items-center justify-center p-1.5`}>
        <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
          <circle cx="250" cy="250" r="250" fill="#FF0420"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M177.133 316.446c-17.482 0-27.897-10.967-27.897-27.442 0-6.47 2.476-13.028 7.373-18.54l60.17-67.17c9.178-10.235 13.863-23.732 13.863-37.86C230.642 143.085 213.417 122 180.373 122c-7.373 0-13.88 1.164-20.387 3.492-23.732 8.426-44.301 29.007-58.663 54.659-8.426 15.071-15.799 32.296-22.282 50.502-7.373 19.564-13.88 40.145-19.564 60.17C53.445 312.954 49 334.672 49 355.253c0 29.007 23.732 52.739 52.739 52.739h84.493c28.523 0 52.739-24.357 52.739-52.739 0-7.373-2.476-14.745-7.373-20.258-6.47-7.373-15.071-10.967-23.732-10.967h-30.733zm-25.421-11.593c-6.47 0-10.966-5.497-10.966-10.966 0-3.492 1.164-6.984 4.656-10.476l60.17-68.334c15.07-16.547 22.281-37.128 22.281-58.663 0-15.07-11.593-26.663-26.663-26.663-7.373 0-13.88 2.476-19.564 7.373-15.07 13.028-26.663 29.007-37.128 46.232-15.07 26.663-26.663 58.663-35.09 91.936-7.372 29.007-10.966 57.53-10.966 83.182 0 20.258 16.547 36.805 36.805 36.805h84.493c19.564 0 35.09-15.526 35.09-35.09 0-10.966-8.426-18.339-18.339-18.339h-84.779z" fill="white"/>
          <path d="M340.369 193.533c0-32.296-27.896-59.81-66.269-59.81-33.46 0-58.663 21.645-63.993 51.816-1.164 5.497 3.492 10.966 9.178 10.966h16.547c4.656 0 8.426-3.492 9.178-8.426 4.656-15.07 16.547-26.663 33.46-26.663 20.258 0 35.09 15.07 35.09 32.296 0 17.226-14.832 32.296-35.09 32.296h-11.593c-6.47 0-11.593 5.497-11.593 11.593v11.593c0 6.47 5.497 11.593 11.593 11.593h11.593c24.357 0 43.921 18.339 43.921 40.145 0 22.282-19.564 40.145-43.921 40.145-19.564 0-36.805-12.757-41.461-30.733-1.164-4.656-5.497-8.426-10.966-8.426h-16.547c-5.686 0-10.342 5.497-9.178 10.966 6.47 34.624 35.09 56.269 70.924 56.269 43.137 0 75.433-32.296 75.433-68.334 0-22.282-11.593-42.54-29.007-54.659 15.07-12.757 23.732-31.12 23.732-52.739z" fill="white"/>
        </svg>
      </div>
    )
  }

  // TON Logo
  if (chainId === 607) {
    return (
      <div className={`${sizeClass} ${className} rounded-full bg-blue-500 flex items-center justify-center p-1.5`}>
        <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
          <path d="M28 56C43.464 56 56 43.464 56 28S43.464 0 28 0 0 12.536 0 28s12.536 28 28 28z" fill="#0098EA"/>
          <path d="M37.563 15.591h-19.126c-2.051 0-3.258 2.285-2.102 3.973l11.563 16.877c1.156 1.688 3.048 1.688 4.204 0l11.563-16.877c1.156-1.688-.051-3.973-2.102-3.973z" fill="#fff"/>
        </svg>
      </div>
    )
  }

  // Fallback for unknown chains
  return (
    <div className={`${sizeClass} ${className} rounded-full bg-gray-400 flex items-center justify-center`}>
      <span className="text-white text-xs font-semibold">?</span>
    </div>
  )
}
