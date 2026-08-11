import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full'
}

const LOGO_SRC = '/mytaskflow-icon.svg'

export function Logo({ className = '', size = 32, variant = 'icon' }: LogoProps) {
  if (variant === 'full') {
    return (
      <div className="flex items-center gap-2">
        <Image
          src={LOGO_SRC}
          alt="MyTaskFlow Logo"
          width={size}
          height={size}
          className={`rounded-xl ${className}`}
          priority
        />
        <span className="font-bold text-lg text-primary">
          MyTaskFlow
        </span>
      </div>
    )
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="MyTaskFlow Logo"
      width={size}
      height={size}
      className={`rounded-xl shadow-lg ${className}`}
      priority
    />
  )
}
