/**
 * 🎯 WHY: LoadingScreen with Progressive Status Updates
 *
 * Shows animated loading while comparing bridge providers.
 * Updates status progressively to keep user engaged.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  country: string
  onComplete?: () => void
}

export function LoadingScreen({ country, onComplete }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { text: `Analyzing ${country}`, icon: '✅', delay: 0 },
    { text: 'Connecting to Symbiosis', icon: '✅', delay: 1500 },
    { text: 'Securing quote', icon: '⏳', delay: 3000 },
  ]

  useEffect(() => {
    // Progress through steps
    const timers = steps.map((step, index) =>
      setTimeout(() => setCurrentStep(index), step.delay)
    )

    // Cleanup
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Spinner */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="8"
              strokeDasharray="60 200"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-8 text-gray-900">
          Fetching best rate...
        </h2>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={currentStep >= index ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 text-left"
            >
              <span className="text-2xl">
                {currentStep >= index ? step.icon : '⭕'}
              </span>
              <span
                className={`text-lg ${
                  currentStep >= index ? 'text-green-600 font-medium' : 'text-gray-400'
                }`}
              >
                {step.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
