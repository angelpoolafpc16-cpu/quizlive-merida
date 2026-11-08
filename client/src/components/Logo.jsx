export default function Logo({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" rx="28" fill="#8dc63f" />
      <path
        d="M24 72V42c0-7 5-12 11-12s11 5 11 12v14c0-7 5-12 11-12s11 5 11 12v26"
        fill="none"
        stroke="#0f2f66"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M50 18c3 2 3 6 0 9-3-3-3-7 0-9z" fill="#0f2f66" />
      <circle cx="44" cy="20" r="3.5" fill="#0f2f66" />
      <circle cx="56" cy="20" r="3.5" fill="#0f2f66" />
    </svg>
  );
}
