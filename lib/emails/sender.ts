import "server-only";
import { Resend } from "resend";

// Single Resend wrapper used by every TwentyThird email template.
//
// Reads RESEND_API_KEY at call time so the route handlers don't need to
// repeat the missing-key bail-out. Returns { ok: true } / { ok: false }
// — callers should treat a false as best-effort and continue.
//
// The shell renderer below is the only place that knows TwentyThird's
// email visual grammar: the reset-password Supabase template
// (rendered server-side by Supabase Auth) is the structural reference.
// Every TwentyThird-sent transactional or scheduled email is composed
// against the same shell — header logo, eyebrow, hero title with an
// italic phrase, lede paragraph, optional CTA + fallback URL, hairline,
// clinical figure footer, optional security note, institutional
// closer, and footer block with logo + tagline + institutional mono
// line + copyright row.
//
// TODO: Resend idempotency-key support on SendInput for true
// exactly-once delivery. Currently table-layer idempotency (via
// scheduled_emails.sent_at) is the only guard.

// TODO: confirm day-23.com is verified in Resend; otherwise fall back
// to "TwentyThird <onboarding@resend.dev>" until verification lands.
export const FROM_EMAIL = "TwentyThird <noreply@day-23.com>";

export type SendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

/**
 * The structured payload every email template returns from its pure
 * `buildXxxEmail()` function. The `sendXxxEmail()` wrapper applies a
 * `to:` and forwards to `sendEmail`. Separating build from send lets
 * the dev preview route render html without invoking Resend.
 */
export type EmailPayload = { subject: string; text: string; html: string };

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY missing — skipping send.");
    return { ok: false, error: "no_api_key" };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [input.to],
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (error) {
      console.error("[email] Resend send error:", error);
      return { ok: false, error: error.message ?? "send_failed" };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    console.error("[email] Resend threw:", e);
    return { ok: false, error: "send_threw" };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ────────────────────────────────────────────────────────────────────
// brandEmailShell
// ────────────────────────────────────────────────────────────────────

export type BrandEmailShellInput = {
  /** Hidden preheader line shown by the email client preview pane. */
  preheader: string;
  /** Inter 11px uppercase letter-spacing 0.22em, e.g. "PROFILE READ". */
  eyebrow: string;
  /**
   * Hero title. The shell asserts that `italicPhrase` is an exact
   * substring of `text` and renders it wrapped in an `<em>` styled at
   * color #a0a0a6 (the brand's italic-voice tint). If the assertion
   * fails the shell throws — never render a title without its italic.
   *
   * Voice rule: one italic phrase per title, 6–9 words total.
   */
  title: { text: string; italicPhrase: string };
  /** Inter 17px line-height 1.55 #a0a0a6. One short paragraph, 1–2 sentences. */
  lede: string;
  /**
   * Optional pill CTA button. Deliberately optional: some emails are
   * destination-less (e.g. intake-submitted — "no action required"
   * confirmations would be undermined by a button, and the room
   * doesn't exist yet at send time). Leave it off rather than point
   * at a 404.
   */
  cta?: { label: string; href: string };
  /** Optional fallback URL block — rendered with the "or paste" preamble. */
  fallbackUrl?: string;
  /**
   * Optional italic-serif blockquote rendered between the lede and the
   * CTA. Used today only by the invite template to carry the inviter's
   * one-line personal note — the single human beat in an otherwise
   * institutional system. Callers MUST trim and length-cap before
   * passing (server-side cap: 140 chars). The shell escapes the text
   * before render — see renderNote() for the contract.
   */
  note?: { italicText: string };
  /** Clinical figure footer: `Fig. NN · [italic]` left, `LABEL · [italic]` right. */
  figureFooter: {
    /** Two-digit string, e.g. "01". */
    figNumber: string;
    /** Italic serif highlight rendered after `Fig. NN · ` on the left. */
    leftItalic: string;
    /** Mono uppercase label rendered before `·` on the right. */
    rightLabel: string;
    /** Italic serif highlight rendered after the right label's `·`. */
    rightItalic: string;
  };
  /** Optional Inter 13px paragraph below the figure footer. */
  securityNote?: string;
};

/**
 * The full TwentyThird email HTML shell. Dark-only — Apple Mail / Gmail
 * dark-mode is the canvas; we force `color-scheme: dark` so the page
 * won't be auto-inverted into something the voice can't survive.
 *
 * Inline SVG logos render in Apple Mail, Gmail web/mobile, and
 * Outlook web. Outlook desktop drops them — the wordmark beside the
 * mark carries the brand identity if the SVG fails to render.
 *
 * Mobile breakpoint at 600px: hero drops 44→36px, section padding
 * compresses, CTA goes full-width, footer columns stay table-cell.
 *
 * **Hero size note:** desktop hero is 44px, not 52px. The reset-password
 * reference uses 52px because its title is 4 words ("A new key, quietly
 * issued."); the longest TwentyThird title in active rotation is the
 * invite — "{Name} would like you in the reading." — which at 52px
 * wraps awkwardly for two-word first names or names ≥ 10 letters. 44px
 * works cleanly across all seven titles in the spec. Don't drift this
 * up without re-testing against the full set.
 *
 * The institutional closer ("CognitiveLab, WelloWork AB" / "ATTENDING
 * INSTITUTION") is rendered unconditionally — every TwentyThird email
 * is signed by the institution, never by a named analyst. This is
 * intentional and unchanging. See ROOM.md Email System section.
 */
export function brandEmailShell(input: BrandEmailShellInput): string {
  const {
    preheader,
    eyebrow,
    title,
    lede,
    cta,
    fallbackUrl,
    figureFooter,
    securityNote,
    note,
  } = input;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(stripItalic(title))}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  a { text-decoration: none; }
  ::selection { background: #ededee; color: #0a0a0b; }
  @media screen and (max-width: 600px) {
    .container { width: 100% !important; padding-left: 24px !important; padding-right: 24px !important; }
    .hero-title { font-size: 36px !important; line-height: 1.06 !important; }
    .section-pad { padding-top: 48px !important; padding-bottom: 48px !important; }
    .footer-cols td { display: table-cell !important; width: auto !important; padding-bottom: 0 !important; }
    .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    .eyebrow { font-size: 10px !important; }
    .lede { font-size: 16px !important; }
    .mono-link { word-break: break-all !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color:#ededee;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0a0a0b;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0b;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#0a0a0b;">
          ${renderHeader()}
          <tr>
            <td class="section-pad" style="padding: 72px 40px 64px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="eyebrow" style="font-family: 'Inter', -apple-system, sans-serif; font-size:11px; font-weight:500; letter-spacing:0.22em; text-transform:uppercase; color:#6a6a72; padding-bottom:24px;">
                    ${escapeHtml(eyebrow)}
                  </td>
                </tr>
                <tr>
                  <td class="hero-title" style="font-family: 'Instrument Serif', Georgia, serif; font-size:44px; line-height:1.04; letter-spacing:-0.025em; color:#ededee; padding-bottom:28px;">
                    ${renderTitleWithItalic(title)}
                  </td>
                </tr>
                <tr>
                  <td class="lede" style="font-family: 'Inter', -apple-system, sans-serif; font-size:17px; line-height:1.55; color:#a0a0a6; padding-bottom:${note || cta || fallbackUrl ? "32" : "0"}px;">
                    ${escapeHtml(lede)}
                  </td>
                </tr>
                ${note ? renderNote(note) : ""}
                ${cta ? renderCta(cta) : ""}
                ${fallbackUrl ? renderFallback(fallbackUrl) : ""}
                <tr>
                  <td style="padding: 56px 0 32px 0; font-size:0; line-height:0;">
                    <div style="height:1px; background-color:#1a1a1c; line-height:1px; font-size:1px;">&nbsp;</div>
                  </td>
                </tr>
                ${renderFigureFooter(figureFooter)}
                ${securityNote ? renderSecurityNote(securityNote) : ""}
                ${renderInstitutionalCloser()}
              </table>
            </td>
          </tr>
          ${renderFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────
// shell sub-renderers (private — exported only for type narrowing)
// ────────────────────────────────────────────────────────────────────

const LOGO_SVG = (size: number, textSize: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <circle cx="22" cy="22" r="20.5" fill="none" stroke="#ededee" stroke-opacity="0.28" stroke-width="0.7"/>
  <path d="M 22 3.5 A 18.5 18.5 0 1 1 4.5 28.5" fill="none" stroke="#ededee" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="22" cy="3.5" r="1.7" fill="#ededee"/>
  <text x="22" y="22" font-family="Inter, sans-serif" font-size="${textSize}" font-weight="500" fill="#ededee" text-anchor="middle" dominant-baseline="central" letter-spacing="-0.02em">23</text>
</svg>`;

function renderHeader(): string {
  return `<tr>
    <td style="padding: 36px 40px 0 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" valign="middle">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:10px;">${LOGO_SVG(28, 14)}</td>
                <td valign="middle" style="font-family: 'Instrument Serif', Georgia, serif; font-size:20px; color:#ededee; letter-spacing:-0.018em; line-height:1;">TwentyThird</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 36px; font-size:0; line-height:0;">
            <div style="height:1px; background-color:#1a1a1c; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderTitleWithItalic(title: {
  text: string;
  italicPhrase: string;
}): string {
  // Build-time invariant: italicPhrase must appear in text. The shell
  // never silently renders a title without its italic — better to fail
  // loudly in dev than to ship a flat headline.
  const { text, italicPhrase } = title;
  if (!italicPhrase || !text.includes(italicPhrase)) {
    throw new Error(
      `brandEmailShell: italicPhrase ${JSON.stringify(
        italicPhrase,
      )} must appear as an exact substring of title text ${JSON.stringify(
        text,
      )}`,
    );
  }
  const idx = text.indexOf(italicPhrase);
  const before = text.slice(0, idx);
  const after = text.slice(idx + italicPhrase.length);
  return `${escapeHtml(before)}<em style="font-style:italic;color:#a0a0a6;">${escapeHtml(italicPhrase)}</em>${escapeHtml(after)}`;
}

function stripItalic(title: { text: string; italicPhrase: string }): string {
  // For the <title> element — italics don't render there anyway.
  return title.text;
}

function renderCta(cta: { label: string; href: string }): string {
  return `<tr>
    <td style="padding-bottom: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="#ededee" style="border-radius: 999px;">
            <a href="${escapeHtml(cta.href)}" class="cta-btn" target="_blank" style="display:inline-block; padding:16px 28px; font-family: 'Inter', -apple-system, sans-serif; font-size:13px; font-weight:500; letter-spacing:-0.005em; color:#0a0a0b; background-color:#ededee; border-radius:999px; text-decoration:none;">
              ${escapeHtml(cta.label)}&nbsp;&nbsp;<span style="font-family:'Instrument Serif', Georgia, serif; font-style:italic; font-size:15px;">&rarr;</span>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderNote(note: { italicText: string }): string {
  // Note is user input — always escapeHtml before render. Same rule
  // for any future user-string slot in this shell. No quotation marks
  // around the text; the italic carries the voice.
  return `<tr>
    <td style="padding-bottom: 32px;">
      <blockquote style="margin:0; padding-left:20px; border-left:1px solid #1a1a1c; font-family: 'Instrument Serif', Georgia, serif; font-style:italic; font-size:18px; line-height:1.5; color:#a0a0a6;">${escapeHtml(note.italicText)}</blockquote>
    </td>
  </tr>`;
}

function renderFallback(url: string): string {
  return `<tr>
    <td style="padding-top: 24px; padding-bottom: 8px;">
      <div style="font-family: 'Inter', -apple-system, sans-serif; font-size:13px; line-height:1.6; color:#6a6a72;">
        <span style="font-family:'Instrument Serif', Georgia, serif; font-style:italic; color:#a0a0a6;">or</span> paste this link into your browser:
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px;">
      <a href="${escapeHtml(url)}" class="mono-link" target="_blank" style="font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; font-size:12px; line-height:1.6; color:#a0a0a6; text-decoration:none; word-break:break-all;">${escapeHtml(url)}</a>
    </td>
  </tr>`;
}

function renderFigureFooter(f: BrandEmailShellInput["figureFooter"]): string {
  return `<tr>
    <td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top" style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:10px; letter-spacing:0.01em; white-space:nowrap; color:#6a6a72; text-transform:uppercase;">
            Fig. ${escapeHtml(f.figNumber)} &nbsp;·&nbsp; <span style="font-family:'Instrument Serif', Georgia, serif; font-style:italic; text-transform:none; letter-spacing:0; font-size:13px; color:#a0a0a6;">${escapeHtml(f.leftItalic)}</span>
          </td>
          <td valign="top" align="right" style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:10px; letter-spacing:0.01em; white-space:nowrap; color:#6a6a72; text-transform:uppercase;">
            ${escapeHtml(f.rightLabel)} &nbsp;·&nbsp; <span style="font-family:'Instrument Serif', Georgia, serif; font-style:italic; text-transform:none; letter-spacing:0; font-size:13px; color:#a0a0a6;">${escapeHtml(f.rightItalic)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderSecurityNote(note: string): string {
  return `<tr>
    <td style="padding-top: 40px; font-family: 'Inter', -apple-system, sans-serif; font-size:13px; line-height:1.6; color:#6a6a72;">${escapeHtml(note)}</td>
  </tr>`;
}

function renderInstitutionalCloser(): string {
  // Always rendered. No prop. The institution signs every email.
  return `<tr>
    <td style="padding-top: 40px;">
      <div style="font-family: 'Instrument Serif', Georgia, serif; font-style:italic; font-size:15px; line-height:1.5; color:#a0a0a6;">CognitiveLab, WelloWork AB</div>
      <div style="padding-top: 8px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#6a6a72;">ATTENDING INSTITUTION</div>
    </td>
  </tr>`;
}

function renderFooter(): string {
  return `<tr>
    <td style="padding: 0 40px 48px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:0; line-height:0; padding-bottom: 32px;">
            <div style="height:1px; background-color:#1a1a1c; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:10px;">${LOGO_SVG(22, 14)}</td>
                <td valign="middle" style="font-family: 'Instrument Serif', Georgia, serif; font-size:16px; color:#ededee; letter-spacing:-0.018em; line-height:1;">TwentyThird</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 14px; font-family: 'Instrument Serif', Georgia, serif; font-style:italic; font-size:15px; color:#a0a0a6; line-height:1.5;">Psychodynamic AI for the inner life.</td>
        </tr>
        <tr>
          <td style="padding-top: 14px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:0.04em; color:#6a6a72; text-transform:uppercase;">CognitiveLab &nbsp;·&nbsp; WelloWork AB</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:40px;">
        <tr>
          <td style="padding-top: 28px; font-size:0; line-height:0;">
            <div style="height:1px; background-color:#1a1a1c; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="footer-cols">
              <tr>
                <td valign="top" style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:0.04em; color:#6a6a72; text-transform:uppercase; white-space:nowrap;">&copy; TwentyThird &nbsp;·&nbsp; CognitiveLab</td>
                <td valign="top" align="right" style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:0.04em; color:#6a6a72; text-transform:uppercase; white-space:nowrap;">Sent by automated system &nbsp;·&nbsp; do not reply</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}
