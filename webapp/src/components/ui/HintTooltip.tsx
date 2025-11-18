import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface HintTooltipProps {
  term: string
  hint: string
  alternatives?: string[]
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

export default function HintTooltip({ 
  term, 
  hint, 
  alternatives = [], 
  children,
  position = 'top',
  size = 'md'
}: HintTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const sizeClasses = {
    sm: 'w-48 p-3 text-sm',
    md: 'w-64 p-4 text-sm',
    lg: 'w-80 p-4 text-base'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1'
  }

  return (
    <div className="relative inline-flex items-center">
      {children || (
        <span className="font-medium text-primary-600 hover:text-primary-700 underline decoration-dotted underline-offset-2 cursor-help">
          {term}
        </span>
      )}
      
      <button
        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label={`Get help with ${term}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isVisible && (
        <>
          {/* Tooltip Content */}
          <div 
            className={`absolute z-50 bg-gray-900 text-white ${sizeClasses[size]} ${positionClasses[position]} shadow-lg`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${arrowClasses[position]}`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h4 className="font-semibold mb-2">{term}</h4>
              <p className="text-gray-300 mb-3">{hint}</p>
              
              {alternatives.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Also known as:</p>
                  <div className="flex flex-wrap gap-1">
                    {alternatives.map((alt, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsVisible(false)}
          ></div>
        </>
      )}
    </div>
  )
}
