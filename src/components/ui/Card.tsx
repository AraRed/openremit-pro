/**
 * 🎯 WHY: Reusable Card Component
 *
 * Cards are containers for content - used everywhere in modern UIs
 * Route cards, info boxes, payment summaries, etc.
 */

import { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'selected'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  className,
  ...props
}: CardProps) {
  const baseClasses = 'rounded-xl transition-all duration-200'

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md hover:shadow-lg',
    outlined: 'bg-white border-2 border-gray-300',
    selected: 'bg-white border-2 border-gray-900 shadow-lg',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        clickable && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Composition Pattern:
 *    - Card is a "container" component
 *    - Takes {children} and wraps with styling
 *    - Flexible: Can contain any content
 *
 * 2. Scale Transform:
 *    - scale-[1.02] = 102% size (subtle grow on hover)
 *    - scale-[0.98] = 98% size (subtle shrink on click)
 *    - Provides tactile feedback
 *
 * 3. Variants for Different Use Cases:
 *    - default: Basic card with border
 *    - elevated: Card with shadow (stands out)
 *    - outlined: Thicker border (emphasis)
 *    - selected: Clear selection state
 *
 * 💼 INTERVIEW: "I use the composition pattern where Card
 *    provides structure and styling, but content is flexible
 *    through the children prop. This is React's core pattern
 *    for reusable components."
 */
