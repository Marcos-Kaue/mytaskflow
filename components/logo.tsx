interface LogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full'
}

export function Logo({ className = "", size = 32, variant = 'icon' }: LogoProps) {
  if (variant === 'full') {
    return (
      <div className="flex items-center gap-2">
        <LogoIcon size={size} className={className} />
        <span className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          MyTaskFlow
        </span>
      </div>
    )
  }

  return <LogoIcon size={size} className={className} />
}

function LogoIcon({ className = "", size = 32 }: Omit<LogoProps, 'variant'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradientes */}
      <defs>
        {/* Gradiente roxo para laranja */}
        <linearGradient id="purpleOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        
        {/* Gradiente laranja para roxo */}
        <linearGradient id="orangePurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      
      {/* Círculo de fundo com gradiente roxo-laranja */}
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="url(#purpleOrange)"
        opacity="0.15"
      />
      
      {/* Círculo de borda com gradiente */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="url(#orangePurple)"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Checkmark principal - roxo */}
      <path
        d="M 35 62 L 52 78 L 85 38"
        stroke="#7C3AED"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Checkmark destaque - laranja */}
      <path
        d="M 35 62 L 52 78 L 85 38"
        stroke="#F97316"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      
      {/* Ponto de destaque no canto superior direito (representa gamificação) */}
      <circle
        cx="95"
        cy="35"
        r="5"
        fill="#F97316"
      />
      
      {/* Pequena linha decorativa */}
      <line
        x1="95"
        y1="42"
        x2="95"
        y2="48"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}
