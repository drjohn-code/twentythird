# TwentyThird — Translation Glossary

> Authoritative for every translation pass and for `scripts/i18n/draft-translations.ts`.
> The machine-draft generator is fed this file with the English source so register, tone,
> and terms of art carry across languages. Reviewers lock **one** translation per controlled
> term per language and use it everywhere.

The brand is editorial-clinical — *a 1920s monograph reissued by a contemporary research lab*.
Translations must preserve that register: short, certain sentences; clinical authority; one
literary flourish per paragraph, never two. Italics signal the half-said (*desire*, *lack*,
*already allowed*) — keep an italicised phrase italicised in the target language, moving it to
the natural equivalent word rather than translating word-for-word. Lowercase italic captions
stay lowercase where the target script has case. Numerals in clinical contexts stay figures
(`37×`, `n = 2,418`), never spelled out.

---

## (a) Do not translate — verbatim in every language

| Term | Notes |
|---|---|
| `TwentyThird` | The brand wordmark. One word, capital T capital T. Never "23rd", "Twenty-Third", "Project 23", "23". |
| `23` | The numeric mark — appears only inside the logo ring and the day-23 figure. Not a translatable word. |
| `CognitiveLab` | The lab. One word. |
| `WelloWork AB` | The company. |
| `CognitiveLab, WelloWork AB` | The institutional closer line in email. Unchanged in every locale. |
| `Freud`, `Lacan`, `Fliess` | Proper names. Use the locale's conventional spelling only if one is genuinely standard; otherwise leave as-is. |
| `Fig.` + figure numbers | `Fig. 01`, `Fig. 23`, etc. The label and number stay; only surrounding prose translates. |
| `Stripe`, `Resend` | Third-party product names. |
| `day-23.com`, `noreply@day-23.com` | Domain and address. |
| `23.23`, `11.11` | Prices. Numerals stay; localise only the sentence around them. |

`ATTENDING INSTITUTION` is the one closer element that **is** localised — it is a label, not a name.

---

## (b) Controlled product terms — one locked translation per language, used everywhere

Translate these into a single, consistent term per language and reuse it in every string,
email, and AI output. Inconsistent renderings of these break the product's voice. Where a term
has no natural equivalent, prefer a faithful clinical coinage over a loose paraphrase; do not
leave it English unless English is genuinely the convention in that language's clinical register.

| English term | Meaning in the product |
|---|---|
| **Room** | The authenticated dashboard / home. Never "Dashboard". |
| **Consulting Room** | The space where the user talks with the analyst (therapy surface). |
| **the analyst** | The AI voice — singular, lowercase in prose. Never "assistant", "bot", "AI", "coach". |
| **session** / **consultation** | One turn-taking exchange in the Consulting Room. |
| **Case File** | The dossier of the user's history and entries. |
| **reading** | One of the analytic units shown to the user (code: `block`). Plural **readings**. |
| **Reading Depth** | How much of the user the reading has had access to. Never "score", "progress", "completion". |
| **Catchup** | The weekly check-in. One word, capitalised as a noun. |
| **connection** | A connected person (inviter / connection). Never "friend", "partner", "contact". |
| **block** | An analytic unit (internal term; user-facing label is **reading**). |
| **intake** | The opening questionnaire that begins a profile. |
| **silent week** | A week with no Catchup — the *"— silent week —"* divider in the Case File. |
| **held question** | A question the user is avoiding / keeping back. |

### Clinical terms of art — translate into the language's psychoanalytic register

These are precise analytic concepts, not casual phrases. Use the established Freudian/Lacanian
equivalent in the target language where one exists (these traditions are translated in every
European language); keep them italicised where the source italicises.

`intimacy threshold` · `father-imago` · `mother-imago` · `primal scene` · `desire structure` ·
`subconscious loop` · `linguistic unconscious` · `professional block` · `relational pattern` ·
`transference` · `defenses` · `shadow` · `dream logic` · `obsessional` · `hysterical` · `lack` ·
`the half-said`

---

## Tone reminders for translators / the generator

- **Forbidden register** (find the target-language equivalent failure and avoid it): wellness-app
  cheerfulness, "we believe", "imagine", "unlock", "journey", exclamation marks.
- **Captions**: italic, lowercase, no terminal punctuation.
- **Headlines**: one strong noun, then an italic qualifier — preserve that two-beat shape.
- **Plurals**: every count goes through ICU `plural` — never concatenate. Slavic/Baltic languages
  must fill `one`/`few`/`many`/`other` as their grammar requires.
- **Safety / crisis copy**: translate plainly and unambiguously. No flourish. Accuracy over style.
