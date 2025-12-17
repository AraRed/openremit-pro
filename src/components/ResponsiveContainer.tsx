import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Responsive container that adapts to mobile (Telegram) and desktop layouts
 * - Mobile: Full width with padding
 * - Desktop: Centered with max width
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full mx-auto px-4 py-6 max-w-[480px] md:max-w-2xl ${className}`}>
      {children}
    </div>
  )
}
