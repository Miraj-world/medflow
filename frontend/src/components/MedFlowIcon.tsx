// Main MedFlow brand icon
// Represents a medical cross combined with a flowing curve
// The curve symbolizes data flow, patient movement, and system connectivity

export default function MedFlowIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size} // Allows dynamic sizing when used in UI
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient used for the cross shape */}
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#60a5fa" /> {/* light blue */}
          <stop offset="100%" stopColor="#1e3a8a" /> {/* darker blue */}
        </linearGradient>
      </defs>

      {/* Vertical bar of the medical cross */}
      <rect
        x="26"
        y="6"
        width="12"
        height="52"
        rx="6" // rounded edges for modern UI look
        fill="url(#grad)"
      />

      {/* Horizontal bar of the medical cross */}
      <rect
        x="6"
        y="26"
        width="52"
        height="12"
        rx="6"
        fill="url(#grad)"
      />

      {/* Flowing curve across the cross
          Represents "flow" in MedFlow (data, patients, workflow) */}
      <path
        d="M6 26C18 10 46 10 58 26"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.8" // slightly softened so it blends with the icon
      />
    </svg>
  );
}