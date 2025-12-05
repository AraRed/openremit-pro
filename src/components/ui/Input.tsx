/**
 * 🎯 WHY: Reusable Input Component
 *
 * Consistent text input styling across the app
 * Includes label, error state, icons support
 */

import { InputHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className,
  ...props
}: InputProps) {
  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full')}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          className={clsx(
            'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error or Helper Text */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Conditional Rendering:
 *    {label && <label>...</label>}
 *    - Only renders if label exists
 *    - Clean way to handle optional UI elements
 *
 * 2. Template Literals in Tailwind:
 *    - Can't use string interpolation in class names!
 *    - ❌ `text-${color}-600` won't work
 *    - ✅ Use clsx with conditionals instead
 *
 * 3. Absolute Positioning for Icons:
 *    - position: absolute on icon container
 *    - position: relative on parent
 *    - top-1/2 + -translate-y-1/2 = perfect vertical center
 *
 * 4. Focus States:
 *    - focus:ring adds outline ring
 *    - focus:border changes border color
 *    - Accessibility: Visual feedback on keyboard navigation
 *
 * 💼 INTERVIEW: "I handle error states with conditional styling.
 *    Red border/ring for errors, gray for normal state. This
 *    provides clear visual feedback to users."
 */
