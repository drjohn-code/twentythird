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
            <Link href="/reports/sample">Sample report</Link>
            <Link href="/plan">Integration plan</Link>
          </div>
          <div className="footer-col">
            <span className="label">Company</span>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/about">Manifesto</Link>
          </div>
          <div className="footer-col">
            <span className="label">Resources</span>
            <Link href="/science">The science</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/papers/professional-blocks">Method paper</Link>
            <Link href="/case-studies/relational-attractor">Case study</Link>
            <Link href="/examples/dream-interpretation">Dream example</Link>
          </div>
          <div className="footer-col">
            <span className="label">Legal</span>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/cookies">Cookies</Link>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 WelloWork AB · all rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
