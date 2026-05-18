import Link from "next/link";
import LogoMark from "../brand/LogoMark";

export default function Nav() {
  return (
    <nav className="nav glass">
      <Link href="/" className="wordmark" aria-label="TwentyThird">
        <LogoMark />
        <span>TwentyThird</span>
      </Link>
      <div className="nav-links">
        <Link href="/#philosophy">Method</Link>
        <Link href="/#brain">The Work</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <div className="nav-right">
        <button
          className="theme-toggle"
          aria-label="Toggle theme"
          id="themeToggle"
          type="button"
        >
          <svg
            className="moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          </svg>
          <svg
            className="sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </button>
        <Link href="/auth/sign-in" className="signin">
          Sign in
        </Link>
        <Link href="/auth/sign-up" className="pill">
          Start <span>→</span>
        </Link>
      </div>
    </nav>
  );
}
