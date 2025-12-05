/**
 * 🎯 WHY: Reusable Button Component
 *
 * Instead of writing <button> everywhere with duplicate styles,
 * we create ONE Button component with all variants.
 *
 * 💼 INTERVIEW: "I create reusable components to:
 *    - Maintain consistent UI/UX
 *    - Single source of truth for styling
 *    - Easy to update (change once, updates everywhere)
 *    - Type-safe props with TypeScript"
 */

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

/**
 * Reusable Button Component
 *
 * Usage:
 * <Button variant="primary" onClick={handleClick}>Click Me</Button>
 * <Button variant="secondary" size="sm">Small Button</Button>
 * <Button isLoading>Loading...</Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  /**
   * 🔧 HOW: clsx for conditional classes
   *
   * clsx combines class names and handles conditionals cleanly
   * Better than manual string concatenation
   */
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95',
    outline: 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50 active:scale-95',
    ghost: 'text-gray-900 hover:bg-gray-100 active:scale-95',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Interface Extending:
 *    extends ButtonHTMLAttributes<HTMLButtonElement>
 *    - Inherits all native button props (onClick, type, etc.)
 *    - Plus our custom props (variant, size, etc.)
 *    - TypeScript will catch invalid props!
 *
 * 2. Spread Operator (...props):
 *    - Passes all extra props to <button>
 *    - Allows onClick, onFocus, etc. to work
 *
 * 3. clsx Library:
 *    - Combines class names
 *    - Handles conditionals cleanly
 *    - Alternative: classnames, tw-merge
 *
 * 4. Variants Pattern:
 *    - Define all button styles once
 *    - Use variant prop to switch between them
 *    - Common in design systems (Shadcn, Radix, etc.)
 *
 * 💼 INTERVIEW TIP: "I use the variants pattern for consistent
 *    theming and easy maintenance. Adding a new variant is just
 *    one line in the variantClasses object."
 */
