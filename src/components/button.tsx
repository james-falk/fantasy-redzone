import React, { ReactNode, MouseEventHandler } from 'react'
import classNames from 'classnames'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
}) => {
  const baseStyles =
    'w-full max-w-xs rounded-lg py-3 px-6 font-medium transition duration-300 ease-in-out transform hover:scale-105'

  const variantStyles = {
    primary: 'nfl-red text-white hover:opacity-90 font-bold uppercase tracking-wide shadow-lg',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 font-semibold',
    outline:
      'bg-transparent border-2 hover:nfl-red hover:text-white font-medium' + ' ' + 'nfl-red-text border-current',
  }

  const disabledStyles = 'bg-[#727f94] text-white cursor-not-allowed'

  return (
    <button
      className={classNames(
        baseStyles,
        disabled ? disabledStyles : variantStyles[variant!]
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
