export default function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 44 44"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <circle
        className="ring"
        cx="22"
        cy="22"
        r="20.5"
        strokeWidth="0.7"
        opacity="0.28"
      />
      <path
        className="arc"
        d="M 22 3.5 A 18.5 18.5 0 1 1 4.5 28.5"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle className="seed" cx="22" cy="3.5" r="1.7" />
      <text className="twentythree" x="22" y="23" textAnchor="middle">
        23
      </text>
    </svg>
  );
}
