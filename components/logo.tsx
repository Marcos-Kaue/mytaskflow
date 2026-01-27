interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo de fundo com gradiente */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      
      {/* Círculo externo */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Checkmark estilizado formando um "T" */}
      <path
        d="M 30 50 L 45 65 L 70 30"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Linha vertical do "T" (Task) */}
      <line
        x1="50"
        y1="30"
        x2="50"
        y2="20"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Pequenos círculos representando progresso */}
      <circle cx="25" cy="75" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="40" cy="80" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="80" r="3" fill="currentColor" opacity="0.9" />
      <circle cx="75" cy="75" r="3" fill="currentColor" />
    </svg>
  )
}

interface LogoTextProps {
  className?: string
}

export function LogoText({ className = "" }: LogoTextProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={40} />
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold tracking-tight">MyTaskFlow</span>
        <span className="text-xs text-muted-foreground tracking-wide">Hábitos & Progresso</span>
      </div>
    </div>
  )
}
