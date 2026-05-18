import Link from "next/link";
import LogoMark from "../brand/LogoMark";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="wordmark">
              <LogoMark size={34} />
              <span>TwentyThird</span>
            </Link>
            <p>
              Psychodynamic AI for the inner life. A quiet room for serious
              thinking.
            </p>
          </div>
          <div className="footer-col">
            <span className="label">Product</span>
            <Link href="/auth/sign-up">Discovery</Link>
            <Link href="/#outcomes">Reports</Link>
            <Link href="/#outcomes">Integration plans</Link>
          </div>
          <div className="footer-col">
            <span className="label">Company</span>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/about">Manifesto</Link>
          </div>
          <div className="footer-col">
            <span className="label">Resources</span>
            <Link href="/#philosophy">Method</Link>
            <Link href="/#brain">The Work</Link>
            <Link href="/about">Origin</Link>
          </div>
          <div className="footer-col">
            <span className="label">Legal</span>
            <Link href="/contact">Privacy</Link>
            <Link href="/contact">Terms</Link>
            <Link href="/contact">Ethics</Link>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 WelloWork AB · all rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
