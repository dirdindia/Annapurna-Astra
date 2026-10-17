import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function MagneticButton({ children, className = '', onClick, type = 'button', disabled = false, ...props }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e) => {
    if (!ref.current || disabled) return
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    setPosition({ x: middleX * 0.28, y: middleY * 0.28 })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  const isChildrenButton = React.isValidElement(children) && (children.type === 'button' || typeof children.type === 'object')
  const isFullWidth = className?.includes('w-full') || (React.isValidElement(children) && children.props?.className?.includes('w-full'))

  if (isChildrenButton) {
    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, mass: 0.1 }}
        className={`${isFullWidth ? 'block w-full' : 'inline-block'} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 14, mass: 0.1 }}
      className={isFullWidth ? 'block w-full' : 'inline-block'}
    >
      <button 
        type={type}
        disabled={disabled}
        onClick={onClick} 
        className={className} 
        {...props}
      >
        {children}
      </button>
    </motion.div>
  )
}
