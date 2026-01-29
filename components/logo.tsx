import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full'
}

export function Logo({ className = "", size = 32, variant = 'icon' }: LogoProps) {
  if (variant === 'full') {
    return (
      <div className="flex items-center gap-2">
        <Image
          src="/icons8-tarefas-96.png"
          alt="MyTaskFlow Logo"
          width={size}
          height={size}
          className={className}
        />
        <span className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          MyTaskFlow
        </span>
      </div>
    )
  }

  return (
    <Image
      src="/icons8-tarefas-96.png"
      alt="MyTaskFlow Logo"
      width={size}
      height={size}
      className={className}
    />
  )
}
