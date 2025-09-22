export function MememakerLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4 36V12H8L14 28L20 12H24L30 28L36 12H40V36H36V20L30 36H26L20 20L14 36H10L4 20V36H4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MememakerLogoMinimal({ className = "" }: { className?: string }) {
  return (
    <svg
      width="40"
      height="32"
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 28V4L8 20L14 4L20 20L26 4L32 20L38 4V28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function MememakerLogoStacked({ className = "" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4 14V4L8 10L12 4V14M20 14V4L24 10L28 4V14M4 28V18L8 24L12 18V28M20 28V18L24 24L28 18V28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function MememakerLogoGeometric({ className = "" }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 38V10H12V28L18 10H24L30 28V10H36V38H30L24 20L18 38H12L6 38Z"
        fill="currentColor"
      />
      <path
        d="M42 10V38L36 38V20L30 38"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  );
}

export function MememakerLogoInterlocked({ className = "" }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        <path
          d="M4 36V12L10 24L16 12L22 24L28 12V36"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M20 36V12L26 24L32 12L38 24L44 12V36"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

export default MememakerLogoMinimal;