import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

// primary / secondary の見た目を切り替えられる共通ボタン
function Button({ variant = 'primary', type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variant}`} {...rest}>
      {children}
    </button>
  )
}

export default Button
