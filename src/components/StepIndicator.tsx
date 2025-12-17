interface Step {
  label: string
  status: 'completed' | 'current' | 'pending' | 'error'
  message?: string
}

interface StepIndicatorProps {
  steps: Step[]
}

/**
 * Visual step indicator for transaction flow
 * Shows progress through approval and execution steps
 */
export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {step.status === 'completed' && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {step.status === 'current' && (
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            )}
            {step.status === 'pending' && (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50" />
            )}
            {step.status === 'error' && (
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              step.status === 'completed' ? 'text-green-700' :
              step.status === 'current' ? 'text-blue-700' :
              step.status === 'error' ? 'text-red-700' :
              'text-gray-500'
            }`}>
              {step.label}
            </p>
            {step.message && (
              <p className={`text-xs mt-1 ${
                step.status === 'error' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {step.message}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
