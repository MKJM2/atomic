
interface IconProps {
  className?: string;
  size?: number;
}

export const SearchIcon = ({ className, size = 20 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const SettingsIcon = ({ className, size = 20 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
      <path d="
        M50 8
        L58 8 L61 18
        L70 22 L78 16
        L84 24 L78 32
        L82 41 L92 44
        L92 56 L82 59
        L78 68 L84 76
        L78 84 L70 78
        L61 82 L58 92
        L50 92 L42 92 L39 82
        L30 78 L22 84
        L16 76 L22 68
        L18 59 L8 56
        L8 44 L18 41
        L22 32 L16 24
        L22 16 L30 22
        L39 18 L42 8
        Z
      "/>
      <circle cx="50" cy="50" r="18" />
    </g>
  </svg>
);

export interface AtomicLogoProps extends IconProps {
  spinning?: boolean;
}

export const AtomicLogo = ({ className, size = 120, spinning = false }: AtomicLogoProps) => {
  // Use a faster orbit when spinning
  const dur = spinning ? "1.5s" : "8s";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-labelledby="atomic-logo-title"
      className={className}
    >
      <title id="atomic-logo-title">Atomic Journal Logo</title>
      <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.3" />
      {/* Proton - Made much larger */}
      <circle cx="100" cy="100" r="20" fill="currentColor" />
      {/* Electron - Made much larger */}
      <circle r="12" fill="currentColor" opacity="0.6">
        <animateMotion dur={dur} repeatCount="indefinite" rotate="auto">
          <mpath href="#atomicOrbitPath" />
        </animateMotion>
      </circle>
      <defs>
        <path
          id="atomicOrbitPath"
          d="M 165 100 a 65 65 0 1 1 -130 0 a 65 65 0 1 1 130 0"
          fill="none"
        />
      </defs>
    </svg>
  );
};
