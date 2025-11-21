import HintTooltip from './HintTooltip'
import { createHintProps } from '@/lib/technicalTerms'

interface HintTextProps {
  termKey: string
  className?: string
  showIcon?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

export default function HintText({ 
  termKey, 
  className = '', 
  showIcon = true,
  position = 'top',
  size = 'md'
}: HintTextProps) {
  const hintProps = createHintProps(termKey)
  
  if (!hintProps) {
    console.warn(`No technical term found for key: ${termKey}`)
    return <span className={className}>{termKey}</span>
  }

  return (
    <HintTooltip 
      {...hintProps}
      position={position}
      size={size}
    >
      {showIcon ? (
        <span className={`font-medium text-primary-600 hover:text-primary-700 underline decoration-dotted underline-offset-2 cursor-help ${className}`}>
          {hintProps.term}
        </span>
      ) : (
        <span className={`font-medium text-primary-600 hover:text-primary-700 ${className}`}>
          {hintProps.term}
        </span>
      )}
    </HintTooltip>
  )
}
