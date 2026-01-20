interface WebcamLogoProps {
  className?: string;
  size?: number;
}

export function WebcamLogo({ className = '', size = 24 }: WebcamLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      <circle
        cx="12"
        cy="10.5"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      <circle
        cx="12"
        cy="10.5"
        r="1.5"
        fill="currentColor"
      />

      <path
        d="M12 17 L12 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M8 20 L16 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
