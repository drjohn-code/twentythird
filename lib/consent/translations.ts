// ────────────────────────────────────────────────────────────────────
// Consent-banner copy — the single source of truth for every language.
//
// Deliberately self-contained (not in messages/*.json): the banner resolves
// its language synchronously on the client and must tolerate a browser-only
// fallback when no site locale is available — neither of which the
// server-resolved next-intl catalog gives us. Six short keys per locale.
//
// English is authored in the TwentyThird voice (short, clinical, certain).
// Every non-English entry is a draft and is marked `// TODO: review
// translation` — ship the draft, but do not treat it as reviewed copy.
// ────────────────────────────────────────────────────────────────────

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n/locales";

export type ConsentCopy = {
  /** Eyebrow label above the body — sans, uppercased by CSS. */
  eyebrow: string;
  /** One or two clinical sentences. */
  body: string;
  /** Primary action — grants analytics. */
  accept: string;
  /** Secondary action — keeps everything denied. */
  decline: string;
  /** Footer re-open control + the banner's accessible region name. */
  manage: string;
  /** Label for the quiet link to /legal/cookies. */
  policyLinkLabel: string;
};

// `Record<Locale, …>` makes a missing locale a compile error — every
// supported language must carry an entry.
export const consentTranslations: Record<Locale, ConsentCopy> = {
  en: {
    eyebrow: "ANALYTICS",
    body: "Analytics record how these pages are read, never who reads them. Nothing is stored until you allow it.",
    accept: "Accept",
    decline: "Decline",
    manage: "Cookie preferences",
    policyLinkLabel: "Cookie policy",
  },
  // TODO: review translation
  bg: {
    eyebrow: "АНАЛИЗ",
    body: "Анализите записват как се четат тези страници, никога кой ги чете. Нищо не се съхранява, докато не разрешите.",
    accept: "Приемам",
    decline: "Отказвам",
    manage: "Настройки за бисквитки",
    policyLinkLabel: "Политика за бисквитките",
  },
  // TODO: review translation
  cs: {
    eyebrow: "ANALYTIKA",
    body: "Analytika zaznamenává, jak se tyto stránky čtou, nikdy kdo je čte. Nic se neuloží, dokud to nepovolíte.",
    accept: "Přijmout",
    decline: "Odmítnout",
    manage: "Nastavení souborů cookie",
    policyLinkLabel: "Zásady používání souborů cookie",
  },
  // TODO: review translation
  da: {
    eyebrow: "ANALYSE",
    body: "Analysen registrerer, hvordan disse sider læses, aldrig hvem der læser dem. Intet gemmes, før du tillader det.",
    accept: "Accepter",
    decline: "Afvis",
    manage: "Cookieindstillinger",
    policyLinkLabel: "Cookiepolitik",
  },
  // TODO: review translation
  de: {
    eyebrow: "ANALYSE",
    body: "Die Analyse erfasst, wie diese Seiten gelesen werden, nie wer sie liest. Nichts wird gespeichert, bevor Sie es erlauben.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    manage: "Cookie-Einstellungen",
    policyLinkLabel: "Cookie-Richtlinie",
  },
  // TODO: review translation
  el: {
    eyebrow: "ΑΝΑΛΥΣΗ",
    body: "Τα αναλυτικά στοιχεία καταγράφουν πώς διαβάζονται αυτές οι σελίδες, ποτέ ποιος τις διαβάζει. Τίποτα δεν αποθηκεύεται μέχρι να το επιτρέψετε.",
    accept: "Αποδοχή",
    decline: "Απόρριψη",
    manage: "Προτιμήσεις cookie",
    policyLinkLabel: "Πολιτική cookie",
  },
  // TODO: review translation
  es: {
    eyebrow: "ANALÍTICA",
    body: "La analítica registra cómo se leen estas páginas, nunca quién las lee. No se almacena nada hasta que lo permitas.",
    accept: "Aceptar",
    decline: "Rechazar",
    manage: "Preferencias de cookies",
    policyLinkLabel: "Política de cookies",
  },
  // TODO: review translation
  et: {
    eyebrow: "ANALÜÜTIKA",
    body: "Analüütika jäädvustab, kuidas neid lehti loetakse, mitte kunagi seda, kes neid loeb. Midagi ei salvestata enne, kui te seda lubate.",
    accept: "Nõustun",
    decline: "Keeldun",
    manage: "Küpsiste eelistused",
    policyLinkLabel: "Küpsiste poliitika",
  },
  // TODO: review translation
  fi: {
    eyebrow: "ANALYTIIKKA",
    body: "Analytiikka kirjaa, miten näitä sivuja luetaan, ei koskaan kuka niitä lukee. Mitään ei tallenneta ennen kuin annat luvan.",
    accept: "Hyväksy",
    decline: "Hylkää",
    manage: "Evästeasetukset",
    policyLinkLabel: "Evästekäytäntö",
  },
  // TODO: review translation
  fr: {
    eyebrow: "ANALYSE",
    body: "Les statistiques mesurent comment ces pages sont lues, jamais qui les lit. Rien n’est enregistré sans votre accord.",
    accept: "Accepter",
    decline: "Refuser",
    manage: "Préférences de cookies",
    policyLinkLabel: "Politique relative aux cookies",
  },
  // TODO: review translation
  ga: {
    eyebrow: "ANAILÍSÍOCHT",
    body: "Taifeadann anailísíocht conas a léitear na leathanaigh seo, ní léann cé a léann iad riamh. Ní stóráiltear aon rud go dtí go gceadaíonn tú é.",
    accept: "Glac leis",
    decline: "Diúltaigh",
    manage: "Roghanna fianán",
    policyLinkLabel: "Polasaí fianán",
  },
  // TODO: review translation
  hr: {
    eyebrow: "ANALITIKA",
    body: "Analitika bilježi kako se te stranice čitaju, nikada tko ih čita. Ništa se ne pohranjuje dok to ne dopustite.",
    accept: "Prihvati",
    decline: "Odbij",
    manage: "Postavke kolačića",
    policyLinkLabel: "Pravila o kolačićima",
  },
  // TODO: review translation
  hu: {
    eyebrow: "ANALITIKA",
    body: "Az analitika azt rögzíti, hogyan olvassák ezeket az oldalakat, soha nem azt, ki olvassa. Semmit sem tárolunk, amíg nem engedélyezi.",
    accept: "Elfogadom",
    decline: "Elutasítom",
    manage: "Cookie-beállítások",
    policyLinkLabel: "Cookie-szabályzat",
  },
  // TODO: review translation
  is: {
    eyebrow: "GREINING",
    body: "Greiningin skráir hvernig þessar síður eru lesnar, aldrei hver les þær. Ekkert er vistað fyrr en þú leyfir það.",
    accept: "Samþykkja",
    decline: "Hafna",
    manage: "Stillingar fyrir vafrakökur",
    policyLinkLabel: "Stefna um vafrakökur",
  },
  // TODO: review translation
  it: {
    eyebrow: "ANALISI",
    body: "Le analisi registrano come queste pagine vengono lette, mai chi le legge. Nulla viene memorizzato finché non lo consenti.",
    accept: "Accetta",
    decline: "Rifiuta",
    manage: "Preferenze cookie",
    policyLinkLabel: "Informativa sui cookie",
  },
  // TODO: review translation
  lt: {
    eyebrow: "ANALITIKA",
    body: "Analitika fiksuoja, kaip skaitomi šie puslapiai, niekada – kas juos skaito. Niekas nesaugoma, kol neleidžiate.",
    accept: "Sutinku",
    decline: "Atsisakau",
    manage: "Slapukų nuostatos",
    policyLinkLabel: "Slapukų politika",
  },
  // TODO: review translation
  lv: {
    eyebrow: "ANALĪTIKA",
    body: "Analītika reģistrē, kā šīs lapas tiek lasītas, nekad — kas tās lasa. Nekas netiek saglabāts, kamēr to neatļaujat.",
    accept: "Piekrist",
    decline: "Noraidīt",
    manage: "Sīkdatņu iestatījumi",
    policyLinkLabel: "Sīkdatņu politika",
  },
  // TODO: review translation
  mt: {
    eyebrow: "ANALITIKA",
    body: "L-analitika tirreġistra kif jinqraw dawn il-paġni, qatt min jaqrahom. Xejn ma jiġi maħżun sakemm ma tippermettix.",
    accept: "Aċċetta",
    decline: "Irrifjuta",
    manage: "Preferenzi tal-cookies",
    policyLinkLabel: "Politika dwar il-cookies",
  },
  // TODO: review translation
  nb: {
    eyebrow: "ANALYSE",
    body: "Analysen registrerer hvordan disse sidene leses, aldri hvem som leser dem. Ingenting lagres før du tillater det.",
    accept: "Godta",
    decline: "Avslå",
    manage: "Innstillinger for informasjonskapsler",
    policyLinkLabel: "Retningslinjer for informasjonskapsler",
  },
  // TODO: review translation
  nl: {
    eyebrow: "ANALYSE",
    body: "Analyses registreren hoe deze pagina’s worden gelezen, nooit wie ze leest. Er wordt niets opgeslagen totdat u het toestaat.",
    accept: "Accepteren",
    decline: "Weigeren",
    manage: "Cookievoorkeuren",
    policyLinkLabel: "Cookiebeleid",
  },
  // TODO: review translation
  pl: {
    eyebrow: "ANALITYKA",
    body: "Analityka rejestruje, jak czytane są te strony, nigdy kto je czyta. Nic nie jest zapisywane, dopóki nie wyrazisz zgody.",
    accept: "Akceptuj",
    decline: "Odrzuć",
    manage: "Ustawienia plików cookie",
    policyLinkLabel: "Polityka plików cookie",
  },
  // TODO: review translation
  pt: {
    eyebrow: "ANÁLISE",
    body: "A análise regista como estas páginas são lidas, nunca quem as lê. Nada é armazenado até que o permita.",
    accept: "Aceitar",
    decline: "Recusar",
    manage: "Preferências de cookies",
    policyLinkLabel: "Política de cookies",
  },
  // TODO: review translation
  ro: {
    eyebrow: "ANALIZĂ",
    body: "Analiza înregistrează cum sunt citite aceste pagini, niciodată cine le citește. Nimic nu este stocat până nu permiteți acest lucru.",
    accept: "Accept",
    decline: "Refuz",
    manage: "Preferințe cookie",
    policyLinkLabel: "Politica privind cookie-urile",
  },
  // TODO: review translation
  sk: {
    eyebrow: "ANALYTIKA",
    body: "Analytika zaznamenáva, ako sa tieto stránky čítajú, nikdy kto ich číta. Nič sa neuloží, kým to nepovolíte.",
    accept: "Prijať",
    decline: "Odmietnuť",
    manage: "Nastavenia súborov cookie",
    policyLinkLabel: "Zásady používania súborov cookie",
  },
  // TODO: review translation
  sl: {
    eyebrow: "ANALITIKA",
    body: "Analitika beleži, kako se te strani berejo, nikoli kdo jih bere. Nič se ne shrani, dokler tega ne dovolite.",
    accept: "Sprejmi",
    decline: "Zavrni",
    manage: "Nastavitve piškotkov",
    policyLinkLabel: "Pravilnik o piškotkih",
  },
  // TODO: review translation
  sv: {
    eyebrow: "ANALYS",
    body: "Analysen registrerar hur dessa sidor läses, aldrig vem som läser dem. Inget lagras förrän du tillåter det.",
    accept: "Acceptera",
    decline: "Avböj",
    manage: "Cookie-inställningar",
    policyLinkLabel: "Cookiepolicy",
  },
  // TODO: review translation
  uk: {
    eyebrow: "АНАЛІТИКА",
    body: "Аналітика фіксує, як читають ці сторінки, ніколи — хто їх читає. Нічого не зберігається, доки ви не дозволите.",
    accept: "Прийняти",
    decline: "Відхилити",
    manage: "Налаштування файлів cookie",
    policyLinkLabel: "Політика щодо файлів cookie",
  },
};

/**
 * Pick the banner language by the spec's priority order:
 *   1) the site's active locale (next-intl resolved it server-side),
 *   2) else the browser's preference list, matched on the base subtag,
 *   3) else English.
 * Always returns a supported `Locale` — an unknown tag never breaks anything.
 */
export function resolveConsentLocale(
  siteLocale: string | undefined,
  navLanguages: readonly string[],
): Locale {
  const base = (tag: string): string => tag.split("-")[0]?.toLowerCase() ?? "";

  if (siteLocale) {
    const b = base(siteLocale);
    if (isSupportedLocale(b)) return b;
  }
  for (const lang of navLanguages) {
    const b = base(lang);
    if (isSupportedLocale(b)) return b;
  }
  return DEFAULT_LOCALE;
}

/** Copy for a resolved locale. */
export function getConsentCopy(locale: Locale): ConsentCopy {
  return consentTranslations[locale];
}
