// The ten intake sections. Single source of truth for copy and the
// question grid. The page at /onboarding/intake/[step] reads from
// this — there is no per-step page file.
//
// Editing rules:
//   - Each headline contains exactly one italic segment.
//   - No: "we believe", "imagine", "unlock", "journey", "Project 23",
//     no wellness clichés.
//   - Question ids are q{step}_{n} and follow source-document order.
//     If you must rename, write a migration that moves the jsonb
//     keys forward (the analysis worker keys off these ids).
//   - Each step has the exact close/open counts defined by the source
//     document. The dev-time self-check at the bottom verifies counts,
//     duplicate ids, italic-segment count, dependency links, and that
//     every question carries a subtitle.
//   - Plain, clear titles. Subtitles in serif italic carry the
//     clinical/literary framing. Never the other way around.
 
import type { StepDef } from "@/lib/types/intake";
 
export const TOTAL_STEPS = 10 as const;
 
const STEPS_INTERNAL: StepDef[] = [
  // ─────────────────────────────────────────────────────────
  // 01 — ORIGINS
  // ─────────────────────────────────────────────────────────
  {
    number: 1,
    slug: "origins",
    eyebrow: "ORIGINS · DEVELOPMENTAL IMPRINTING",
    headline: [
      { text: "What the early room " },
      { text: "taught you", italic: true },
      { text: "." },
    ],
    lede:
      "The first section listens for emotional climate, safety, and the role you were cast in. Patterns recorded here become the floor everything later is built on.",
    estMinutes: 14,
    closeQuestions: [
      {
        kind: "multi",
        id: "q1_1",
        number: "Q1.1",
        title: "Which words best describe the home you grew up in.",
        subtitle: "pick up to three — homes are rarely one thing",
        maxSelections: 3,
        options: [
          { value: "calm", label: "Calm" },
          { value: "strict", label: "Strict" },
          { value: "emotionally_distant", label: "Emotionally distant" },
          { value: "chaotic", label: "Chaotic" },
          { value: "achievement_focused", label: "Highly achievement-focused" },
          { value: "protective", label: "Protective" },
          { value: "unpredictable", label: "Unpredictable" },
          { value: "conflict_heavy", label: "Conflict-heavy" },
        ],
      },
      {
        kind: "single",
        id: "q1_2",
        number: "Q1.2",
        title: "As a child, what role did you naturally take.",
        subtitle: "the part you played without being asked",
        layout: "vertical",
        options: [
          { value: "peacemaker", label: "Peacemaker" },
          { value: "achiever", label: "Achiever" },
          { value: "invisible_child", label: "Invisible child" },
          { value: "caregiver", label: "Caregiver" },
          { value: "rebel", label: "Rebel" },
          { value: "funny_one", label: "Funny one" },
          { value: "responsible_one", label: "Responsible one" },
          { value: "problem_child", label: "Problem child" },
        ],
      },
      {
        kind: "scale",
        id: "q1_3",
        number: "Q1.3",
        title: "How emotionally safe did you feel growing up.",
        subtitle: "the felt sense, not the official story",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER SAFE",
        highLabel: "10 · FULLY SAFE",
      },
      {
        kind: "single",
        id: "q1_4",
        number: "Q1.4",
        title: "Were emotions openly discussed at home.",
        subtitle: "spoken about, not just felt in the room",
        layout: "horizontal",
        options: [
          { value: "frequently", label: "Frequently" },
          { value: "sometimes", label: "Sometimes" },
          { value: "rarely", label: "Rarely" },
          { value: "never", label: "Never" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q1_5",
        number: "Q1.5",
        title: "One memory from childhood that still feels emotionally alive today.",
        subtitle: "the scene that returns on its own",
      },
      {
        kind: "open",
        id: "q1_6",
        number: "Q1.6",
        title: "What did you learn you had to do to receive love or approval.",
        subtitle: "the small currency of early belonging",
      },
      {
        kind: "open",
        id: "q1_7",
        number: "Q1.7",
        title: "What emotions were difficult to express in your home.",
        subtitle: "the ones that did not have a place at the table",
      },
      {
        kind: "open",
        id: "q1_8",
        number: "Q1.8",
        title: "When you think about your younger self, what do you feel toward them.",
        subtitle: "tenderness, distance, irritation — write what is true",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 02 — ATTACHMENT
  // ─────────────────────────────────────────────────────────
  {
    number: 2,
    slug: "attachment",
    eyebrow: "ATTACHMENT · FAMILY STRUCTURE",
    headline: [
      { text: "The first " },
      { text: "bonds", italic: true },
      { text: ", and the shape they left." },
    ],
    lede:
      "Locates your attachment style, your relation to authority, and the triangulation you grew up inside. The shape of the first bond becomes the template every later one is measured against.",
    estMinutes: 12,
    closeQuestions: [
      {
        kind: "multi",
        id: "q2_1",
        number: "Q2.1",
        title: "How would you describe your mother or primary maternal caregiver.",
        subtitle: "the figure who held the maternal role, by blood or otherwise",
        maxSelections: 3,
        options: [
          { value: "warm", label: "Warm" },
          { value: "controlling", label: "Controlling" },
          { value: "emotionally_unavailable", label: "Emotionally unavailable" },
          { value: "sacrificing", label: "Sacrificing" },
          { value: "critical", label: "Critical" },
          { value: "anxious", label: "Anxious" },
          { value: "unpredictable", label: "Unpredictable" },
          { value: "admired", label: "Admired" },
          { value: "fearful", label: "Fearful" },
          { value: "not_applicable", label: "Not applicable" },
        ],
      },
      {
        kind: "multi",
        id: "q2_2",
        number: "Q2.2",
        title: "How would you describe your father or primary paternal caregiver.",
        subtitle: "the figure who held the paternal role, by blood or otherwise",
        maxSelections: 3,
        options: [
          { value: "supportive", label: "Supportive" },
          { value: "distant", label: "Distant" },
          { value: "dominant", label: "Dominant" },
          { value: "passive", label: "Passive" },
          { value: "ambitious", label: "Ambitious" },
          { value: "emotionally_closed", label: "Emotionally closed" },
          { value: "protective", label: "Protective" },
          { value: "critical", label: "Critical" },
          { value: "absent", label: "Absent" },
          { value: "not_applicable", label: "Not applicable" },
        ],
      },
      {
        kind: "single",
        id: "q2_3",
        number: "Q2.3",
        title: "Your sibling position.",
        subtitle: "the order you arrived in",
        layout: "horizontal",
        options: [
          { value: "oldest", label: "Oldest" },
          { value: "middle", label: "Middle" },
          { value: "youngest", label: "Youngest" },
          { value: "only_child", label: "Only child" },
        ],
      },
      {
        kind: "single",
        id: "q2_4",
        number: "Q2.4",
        title: "Which role best fits your sibling position.",
        subtitle: "the part you played among them",
        layout: "vertical",
        options: [
          { value: "responsible", label: "Responsible" },
          { value: "ignored", label: "Ignored" },
          { value: "compared", label: "Compared to others" },
          { value: "favored", label: "Favored" },
          { value: "competitive", label: "Competitive" },
          { value: "protective", label: "Protective" },
          { value: "not_applicable", label: "Not applicable" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q2_5",
        number: "Q2.5",
        title: "Which parent understood you best.",
        subtitle: "the one who saw something the other did not",
      },
      {
        kind: "open",
        id: "q2_6",
        number: "Q2.6",
        title: "Which parent influenced your fears the most.",
        subtitle: "the voice you still hear when something goes wrong",
      },
      {
        kind: "open",
        id: "q2_7",
        number: "Q2.7",
        title: "What did conflict look like in your family.",
        subtitle: "loud, silent, ritualised — describe the shape",
      },
      {
        kind: "open",
        id: "q2_8",
        number: "Q2.8",
        title: "What kind of attention felt hardest to receive.",
        subtitle: "praise, concern, closeness — name the one that did not land",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 03 — AUTHORITY
  // ─────────────────────────────────────────────────────────
  {
    number: 3,
    slug: "authority",
    eyebrow: "AUTHORITY · SYMBOLIC LAW",
    headline: [
      { text: "The voices you " },
      { text: "inherited", italic: true },
      { text: "." },
    ],
    lede:
      "Surfaces the moral codes, guilt structures, and inherited identity still running in the background. The voices you grew up under rarely leave; they become the voice that judges you.",
    estMinutes: 11,
    closeQuestions: [
      {
        kind: "scale",
        id: "q3_1",
        number: "Q3.1",
        title: "How religious or spiritual was the environment you grew up in.",
        subtitle: "the air in the home, not your current belief",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT AT ALL",
        highLabel: "10 · DEEPLY",
      },
      {
        kind: "single",
        id: "q3_2",
        number: "Q3.2",
        title: "Which message was strongest growing up.",
        subtitle: "the one repeated so often you stopped hearing it",
        layout: "vertical",
        options: [
          { value: "success", label: "Success matters most" },
          { value: "reputation", label: "Reputation matters most" },
          { value: "obedience", label: "Obedience matters most" },
          { value: "family_loyalty", label: "Family loyalty matters most" },
          { value: "independence", label: "Independence matters most" },
          { value: "sacrifice", label: "Sacrifice matters most" },
        ],
      },
      {
        kind: "scale",
        id: "q3_3",
        number: "Q3.3",
        title: "How strongly do you feel judged by society.",
        subtitle: "the watching, real or imagined",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT AT ALL",
        highLabel: "10 · CONSTANTLY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q3_4",
        number: "Q3.4",
        title: "What beliefs from your upbringing still shape you.",
        subtitle: "the ones you carry without choosing to",
      },
      {
        kind: "open",
        id: "q3_5",
        number: "Q3.5",
        title: "Which beliefs do you secretly resist.",
        subtitle: "the line you would not cross in public",
      },
      {
        kind: "open",
        id: "q3_6",
        number: "Q3.6",
        title: "What would your family or community disapprove of most about the real you.",
        subtitle: "the part you do not bring home",
      },
      {
        kind: "open",
        id: "q3_7",
        number: "Q3.7",
        title: "What kind of person were you expected to become.",
        subtitle: "the future drawn for you before you could speak",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 04 — BELONGING
  // ─────────────────────────────────────────────────────────
  {
    number: 4,
    slug: "belonging",
    eyebrow: "BELONGING · SOCIAL IDENTITY",
    headline: [
      { text: "Who gets to " },
      { text: "see you", italic: true },
      { text: "." },
    ],
    lede:
      "Measures social dependence, identity masking, and the fear of exclusion. Belonging is rarely free; this section asks what you trade for it.",
    estMinutes: 10,
    closeQuestions: [
      {
        kind: "single",
        id: "q4_1",
        number: "Q4.1",
        title: "How many people truly know the real you.",
        subtitle: "the ones who would not be surprised by anything in here",
        layout: "horizontal",
        options: [
          { value: "none", label: "None" },
          { value: "one_two", label: "1–2" },
          { value: "three_five", label: "3–5" },
          { value: "many", label: "Many" },
        ],
      },
      {
        kind: "single",
        id: "q4_2",
        number: "Q4.2",
        title: "In groups, you usually become.",
        subtitle: "the role you slip into without deciding",
        layout: "vertical",
        options: [
          { value: "leader", label: "Leader" },
          { value: "observer", label: "Observer" },
          { value: "entertainer", label: "Entertainer" },
          { value: "mediator", label: "Mediator" },
          { value: "intellectual", label: "Intellectual" },
          { value: "caregiver", label: "Caregiver" },
          { value: "withdrawn", label: "Withdrawn" },
        ],
      },
      {
        kind: "scale",
        id: "q4_3",
        number: "Q4.3",
        title: "How afraid are you of disappointing others.",
        subtitle: "the weight of someone else's expression",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT AT ALL",
        highLabel: "10 · DAILY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q4_4",
        number: "Q4.4",
        title: "What parts of yourself do you hide socially.",
        subtitle: "the pieces you leave at the door",
      },
      {
        kind: "open",
        id: "q4_5",
        number: "Q4.5",
        title: "When do you feel most accepted.",
        subtitle: "the room you do not have to translate yourself in",
      },
      {
        kind: "open",
        id: "q4_6",
        number: "Q4.6",
        title: "What social situations drain you most.",
        subtitle: "the ones that cost more than they give",
      },
      {
        kind: "open",
        id: "q4_7",
        number: "Q4.7",
        title: "What kind of people do you envy.",
        subtitle: "envy is usually a pointer to something you have not let yourself want",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 05 — PERSONA
  // ─────────────────────────────────────────────────────────
  {
    number: 5,
    slug: "persona",
    eyebrow: "PERSONA · DESIRE & DIGITAL SELF",
    headline: [
      { text: "The self you " },
      { text: "perform", italic: true },
      { text: "." },
    ],
    lede:
      "Reads the idealised self, the validation loop, and the symbolic performance you stage online. The persona is not a lie; it is a half-revealed wish.",
    estMinutes: 13,
    closeQuestions: [
      {
        kind: "multi",
        id: "q5_1",
        number: "Q5.1",
        title: "Which platforms do you actively use.",
        subtitle: "the ones you open without thinking",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "x", label: "X" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "youtube", label: "YouTube" },
          { value: "reddit", label: "Reddit" },
          { value: "facebook", label: "Facebook" },
          { value: "snapchat", label: "Snapchat" },
          { value: "none", label: "None" },
        ],
      },
      {
        kind: "per_option_number",
        id: "q5_2",
        number: "Q5.2",
        title: "Average daily usage per platform.",
        subtitle: "one row per platform you selected above",
        unit: "MINUTES PER DAY",
        min: 0,
        max: 1440,
        dependsOn: "q5_1",
      },
      {
        kind: "multi",
        id: "q5_3",
        number: "Q5.3",
        title: "What you mainly use them for.",
        subtitle: "the real reason underneath the obvious one",
        options: [
          { value: "validation", label: "Validation" },
          { value: "learning", label: "Learning" },
          { value: "escapism", label: "Escapism" },
          { value: "networking", label: "Networking" },
          { value: "self_expression", label: "Self-expression" },
          { value: "entertainment", label: "Entertainment" },
          { value: "comparison", label: "Comparison" },
          { value: "dating", label: "Dating" },
        ],
      },
      {
        kind: "single",
        id: "q5_4",
        number: "Q5.4",
        title: "How often do you delete or edit posts before publishing.",
        subtitle: "the small rehearsal before going public",
        layout: "horizontal",
        options: [
          { value: "always", label: "Always" },
          { value: "often", label: "Often" },
          { value: "sometimes", label: "Sometimes" },
          { value: "rarely", label: "Rarely" },
          { value: "never", label: "Never" },
        ],
      },
      {
        kind: "scale",
        id: "q5_5",
        number: "Q5.5",
        title: "How often do you compare your life to others online.",
        subtitle: "the quiet ledger you keep against other feeds",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · CONSTANTLY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q5_6",
        number: "Q5.6",
        title: "What version of yourself appears online.",
        subtitle: "describe the character, not the captions",
      },
      {
        kind: "open",
        id: "q5_7",
        number: "Q5.7",
        title: "What do you seek emotionally when you open social media.",
        subtitle: "the feeling you are reaching for, before the scroll begins",
      },
      {
        kind: "open",
        id: "q5_8",
        number: "Q5.8",
        title: "What kind of content makes you uncomfortable.",
        subtitle: "discomfort usually points to something close",
      },
      {
        kind: "open",
        id: "q5_9",
        number: "Q5.9",
        title: "What kind of people attract your attention online.",
        subtitle: "the ones you stop scrolling for",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 06 — DESIRE
  // ─────────────────────────────────────────────────────────
  {
    number: 6,
    slug: "desire",
    eyebrow: "DESIRE · INTIMACY & REPETITION",
    headline: [
      { text: "The pattern that " },
      { text: "keeps returning", italic: true },
      { text: "." },
    ],
    lede:
      "Finds the recurring relational shape, the abandonment fear, the contradiction inside desire. What repeats is rarely chosen; it is what asks to be seen.",
    estMinutes: 13,
    closeQuestions: [
      {
        kind: "single",
        id: "q6_1",
        number: "Q6.1",
        title: "Your current relationship status.",
        subtitle: "where you are right now, not where you would like to be",
        layout: "vertical",
        options: [
          { value: "single", label: "Single" },
          { value: "dating", label: "Dating" },
          { value: "in_relationship", label: "In a relationship" },
          { value: "engaged", label: "Engaged" },
          { value: "married", label: "Married" },
          { value: "separated_divorced", label: "Separated or divorced" },
          { value: "widowed", label: "Widowed" },
          { value: "its_complicated", label: "It's complicated" },
        ],
      },
      {
        kind: "number",
        id: "q6_2",
        number: "Q6.2",
        title: "How many serious relationships have you been in.",
        subtitle: "the ones that mattered, not the ones that lasted",
        unit: "COUNT",
        min: 0,
        max: 99,
      },
      {
        kind: "multi",
        id: "q6_3",
        number: "Q6.3",
        title: "Typical conflicts in your relationships.",
        subtitle: "the arguments that keep arriving in different clothes",
        options: [
          { value: "distance", label: "Distance" },
          { value: "jealousy", label: "Jealousy" },
          { value: "control", label: "Control" },
          { value: "emotional_unavailability", label: "Emotional unavailability" },
          { value: "communication", label: "Communication" },
          { value: "trust", label: "Trust" },
          { value: "dependency", label: "Dependency" },
        ],
      },
      {
        kind: "multi",
        id: "q6_4",
        number: "Q6.4",
        title: "In relationships you tend to.",
        subtitle: "the move you make under pressure",
        options: [
          { value: "pursue", label: "Pursue" },
          { value: "withdraw", label: "Withdraw" },
          { value: "overgive", label: "Overgive" },
          { value: "test_loyalty", label: "Test loyalty" },
          { value: "avoid_vulnerability", label: "Avoid vulnerability" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q6_5",
        number: "Q6.5",
        title: "What kind of people do you repeatedly fall for.",
        subtitle: "the shape that keeps walking through the door",
      },
      {
        kind: "open",
        id: "q6_6",
        number: "Q6.6",
        title: "What usually ends your relationships.",
        subtitle: "the moment they unravel — not the official reason",
      },
      {
        kind: "open",
        id: "q6_7",
        number: "Q6.7",
        title: "What emotional need do you most want fulfilled.",
        subtitle: "the one you find hardest to ask for plainly",
      },
      {
        kind: "open",
        id: "q6_8",
        number: "Q6.8",
        title: "What do you fear most in intimacy.",
        subtitle: "the door you have not been able to walk fully through",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 07 — ACHIEVEMENT
  // ─────────────────────────────────────────────────────────
  {
    number: 7,
    slug: "achievement",
    eyebrow: "ACHIEVEMENT · WORK & RECOGNITION",
    headline: [
      { text: "What you are " },
      { text: "trying to prove", italic: true },
      { text: "." },
    ],
    lede:
      "Detects achievement anxiety, recognition hunger, and your relation to authority at work. Underneath every ambition is an audience of one or two people.",
    estMinutes: 11,
    closeQuestions: [
      {
        kind: "single",
        id: "q7_1",
        number: "Q7.1",
        title: "Your current employment status.",
        subtitle: "the shape of your working week",
        layout: "vertical",
        options: [
          { value: "employed_full_time", label: "Employed, full-time" },
          { value: "employed_part_time", label: "Employed, part-time" },
          { value: "self_employed", label: "Self-employed or founder" },
          { value: "freelance", label: "Freelance or contract" },
          { value: "studying", label: "Studying" },
          { value: "between_roles", label: "Between roles" },
          { value: "caregiving", label: "Caregiving at home" },
          { value: "retired", label: "Retired" },
          { value: "not_working", label: "Not working" },
        ],
      },
      {
        kind: "scale",
        id: "q7_2",
        number: "Q7.2",
        title: "How satisfied are you with your career direction.",
        subtitle: "the trajectory, not today's mood",
        min: 1,
        max: 10,
        lowLabel: "1 · LOST",
        highLabel: "10 · EXACTLY RIGHT",
      },
      {
        kind: "multi",
        id: "q7_3",
        number: "Q7.3",
        title: "At work you are usually.",
        subtitle: "the stance you take when no one is watching",
        options: [
          { value: "perfectionistic", label: "Perfectionistic" },
          { value: "avoidant", label: "Avoidant" },
          { value: "competitive", label: "Competitive" },
          { value: "cooperative", label: "Cooperative" },
          { value: "over_responsible", label: "Over-responsible" },
          { value: "detached", label: "Detached" },
        ],
      },
      {
        kind: "single",
        id: "q7_4",
        number: "Q7.4",
        title: "Your biggest workplace stress.",
        subtitle: "the one that keeps you up the night before",
        layout: "vertical",
        options: [
          { value: "criticism", label: "Criticism" },
          { value: "failure", label: "Failure" },
          { value: "visibility", label: "Visibility" },
          { value: "authority", label: "Authority" },
          { value: "uncertainty", label: "Uncertainty" },
          { value: "conflict", label: "Conflict" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q7_5",
        number: "Q7.5",
        title: "What does success emotionally mean to you.",
        subtitle: "the feeling underneath the metric",
      },
      {
        kind: "open",
        id: "q7_6",
        number: "Q7.6",
        title: "What kind of recognition affects you most.",
        subtitle: "the praise that lands and the praise that bounces off",
      },
      {
        kind: "open",
        id: "q7_7",
        number: "Q7.7",
        title: "What failure still influences you today.",
        subtitle: "the one you have not quite finished metabolising",
      },
      {
        kind: "open",
        id: "q7_8",
        number: "Q7.8",
        title: "If money disappeared, what would you pursue.",
        subtitle: "the work you would do without being paid to",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 08 — ESCAPE
  // ─────────────────────────────────────────────────────────
  {
    number: 8,
    slug: "escape",
    eyebrow: "ESCAPE · PLEASURE & RITUAL",
    headline: [
      { text: "Where you go " },
      { text: "to not be here", italic: true },
      { text: "." },
    ],
    lede:
      "Identifies the avoidance patterns, the compulsions, and the rituals that regulate pleasure. The exit you reach for says as much as the room you leave.",
    estMinutes: 10,
    closeQuestions: [
      {
        kind: "multi",
        id: "q8_1",
        number: "Q8.1",
        title: "How do you usually cope with stress.",
        subtitle: "what the body reaches for when the mind is loud",
        options: [
          { value: "isolation", label: "Isolation" },
          { value: "food", label: "Food" },
          { value: "gaming", label: "Gaming" },
          { value: "exercise", label: "Exercise" },
          { value: "overworking", label: "Overworking" },
          { value: "scrolling", label: "Scrolling" },
          { value: "substance_use", label: "Substance use" },
          { value: "shopping", label: "Shopping" },
          { value: "sleeping", label: "Sleeping" },
          { value: "socializing", label: "Socializing" },
        ],
      },
      {
        kind: "single",
        id: "q8_2",
        number: "Q8.2",
        title: "How often do you go out socially.",
        subtitle: "in person, not on a screen",
        layout: "vertical",
        options: [
          { value: "multiple_per_week", label: "Multiple times per week" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "rarely", label: "Rarely" },
          { value: "never", label: "Never" },
        ],
      },
      {
        kind: "scale",
        id: "q8_3",
        number: "Q8.3",
        title: "How often do you feel lonely even in a group.",
        subtitle: "the room is full, the room is empty",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · ALWAYS",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q8_4",
        number: "Q8.4",
        title: "What activities make you forget yourself.",
        subtitle: "the ones where time disappears, for better or worse",
      },
      {
        kind: "open",
        id: "q8_5",
        number: "Q8.5",
        title: "What do you avoid thinking about most.",
        subtitle: "the door you walk past quickly",
      },
      {
        kind: "open",
        id: "q8_6",
        number: "Q8.6",
        title: "When do you feel emotionally numb.",
        subtitle: "the moments the volume drops to zero",
      },
      {
        kind: "open",
        id: "q8_7",
        number: "Q8.7",
        title: "What habit feels hardest to stop.",
        subtitle: "the one you have tried to put down more than once",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 09 — SELF-RELATION
  // ─────────────────────────────────────────────────────────
  {
    number: 9,
    slug: "self-relation",
    eyebrow: "SELF-RELATION · INTERNAL DIALOGUE",
    headline: [
      { text: "The voice you can't " },
      { text: "quite quiet", italic: true },
      { text: "." },
    ],
    lede:
      "Maps the superego's edge, the shame structures, and the internalised voices. The way you speak to yourself in private is the most honest record of who raised you.",
    estMinutes: 12,
    closeQuestions: [
      {
        kind: "scale",
        id: "q9_1",
        number: "Q9.1",
        title: "How self-critical are you.",
        subtitle: "the tone, not the content",
        min: 1,
        max: 10,
        lowLabel: "1 · GENTLE",
        highLabel: "10 · MERCILESS",
      },
      {
        kind: "single",
        id: "q9_2",
        number: "Q9.2",
        title: "Which statement feels closest to your private fear.",
        subtitle: "the sentence that lives underneath the others",
        layout: "vertical",
        options: [
          { value: "never_enough", label: "I am never enough" },
          { value: "fear_abandoned", label: "I fear being abandoned" },
          { value: "fear_losing_control", label: "I fear losing control" },
          { value: "fear_failure", label: "I fear failure" },
          { value: "fear_ordinary", label: "I fear being ordinary" },
          { value: "fear_rejection", label: "I fear rejection" },
          { value: "fear_dependence", label: "I fear dependence" },
        ],
      },
      {
        kind: "scale",
        id: "q9_3",
        number: "Q9.3",
        title: "How often do you feel disconnected from yourself.",
        subtitle: "watching your life from a small distance",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · DAILY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q9_4",
        number: "Q9.4",
        title: "What thought repeats in your mind most often.",
        subtitle: "the loop you have learned to live alongside",
      },
      {
        kind: "open",
        id: "q9_5",
        number: "Q9.5",
        title: "What do you criticise yourself for privately.",
        subtitle: "the things no one else knows you are scoring",
      },
      {
        kind: "open",
        id: "q9_6",
        number: "Q9.6",
        title: "What would make you feel enough.",
        subtitle: "be honest — the answer is often smaller than expected",
      },
      {
        kind: "open",
        id: "q9_7",
        number: "Q9.7",
        title: "If your inner voice had a personality, how would you describe it.",
        subtitle: "age, gender, tone — and whose voice it might be",
      },
    ],
  },
 
  // ─────────────────────────────────────────────────────────
  // 10 — FUTURE · FANTASY, FEAR & DESIRE
  // ─────────────────────────────────────────────────────────
  {
    number: 10,
    slug: "future-fantasy",
    eyebrow: "FUTURE · FANTASY, FEAR & DESIRE",
    headline: [
      { text: "What you are " },
      { text: "truly searching for", italic: true },
      { text: "." },
    ],
    lede:
      "The emotional climax — the future you imagine, the fear that haunts it, the core desire underneath. The last question is the first one returned.",
    estMinutes: 14,
    epigraph: "the last question is always the first one again.",
    closeQuestions: [
      {
        kind: "single",
        id: "q10_1",
        number: "Q10.1",
        title: "Which matters more to you.",
        subtitle: "pick one — the others can still matter, but not most",
        layout: "vertical",
        options: [
          { value: "freedom", label: "Freedom" },
          { value: "love", label: "Love" },
          { value: "recognition", label: "Recognition" },
          { value: "stability", label: "Stability" },
          { value: "power", label: "Power" },
          { value: "meaning", label: "Meaning" },
          { value: "peace", label: "Peace" },
          { value: "influence", label: "Influence" },
        ],
      },
      {
        kind: "scale",
        id: "q10_2",
        number: "Q10.2",
        title: "How hopeful are you about your future.",
        subtitle: "the felt sense, not the position you defend out loud",
        min: 1,
        max: 10,
        lowLabel: "1 · NONE",
        highLabel: "10 · DEEPLY",
      },
      {
        kind: "single",
        id: "q10_3",
        number: "Q10.3",
        title: "What do you secretly want most.",
        subtitle: "the want you have not quite let yourself name",
        layout: "vertical",
        options: [
          { value: "to_be_understood", label: "To be understood" },
          { value: "to_be_admired", label: "To be admired" },
          { value: "to_feel_safe", label: "To feel safe" },
          { value: "to_be_desired", label: "To be desired" },
          { value: "to_feel_important", label: "To feel important" },
          { value: "to_feel_free", label: "To feel free" },
          { value: "to_belong", label: "To belong" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q10_4",
        number: "Q10.4",
        title: "Describe your ideal future life in detail.",
        subtitle: "the morning, the people, the light, the work",
      },
      {
        kind: "open",
        id: "q10_5",
        number: "Q10.5",
        title: "What fear could destroy that future.",
        subtitle: "the shape that has stopped you before",
      },
      {
        kind: "open",
        id: "q10_6",
        number: "Q10.6",
        title: "What part of yourself are you still trying to become.",
        subtitle: "the version of you on the horizon",
      },
      {
        kind: "open",
        id: "q10_7",
        number: "Q10.7",
        title: "If nobody judged you, how would you live differently.",
        subtitle: "everything you would do if the watching stopped",
      },
      {
        kind: "open",
        id: "q10_8",
        number: "Q10.8",
        title: "What do you think you are truly searching for.",
        subtitle: "the answer underneath every previous answer",
      },
    ],
  },
];
 
export const STEPS: readonly StepDef[] = STEPS_INTERNAL;
 
export function getStep(stepNumber: number): StepDef | null {
  if (!Number.isInteger(stepNumber)) return null;
  if (stepNumber < 1 || stepNumber > TOTAL_STEPS) return null;
  return STEPS_INTERNAL[stepNumber - 1] ?? null;
}
 
export function getStepBySlug(slug: string): StepDef | null {
  return STEPS_INTERNAL.find((s) => s.slug === slug) ?? null;
}
 
export function isValidStepNumber(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= TOTAL_STEPS
  );
}
 
// ─────────────────────────────────────────────────────────
// Dev-time self-check. Fails loudly if the file drifts.
// Verifies:
//   - exactly one italic segment per headline
//   - exactly 4 open questions per step (source-document rule)
//   - no duplicate question ids inside a step
//   - every question has a subtitle (consistent rhythm)
//   - per_option_number questions point at an existing id in the same step
//   - lede is at most 2 sentences (voice rule)
// ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  for (const s of STEPS_INTERNAL) {
    const italics = s.headline.filter((seg) => seg.italic).length;
    if (italics !== 1) {
      console.warn(
        `[intake] step ${s.number} (${s.slug}) has ${italics} italic segments (expected 1)`,
      );
    }
 
    // Source document: 4 open per step, with Step 10 (the climax) at 5.
    const expectedOpen = s.number === 10 ? 5 : 4;
    if (s.openQuestions.length !== expectedOpen) {
      console.warn(
        `[intake] step ${s.number} (${s.slug}) has ${s.openQuestions.length} open questions (expected ${expectedOpen})`,
      );
    }
 
    const all = [...s.closeQuestions, ...s.openQuestions];
    const ids = new Set<string>();
    for (const q of all) {
      if (ids.has(q.id)) {
        console.warn(`[intake] duplicate question id ${q.id} in step ${s.number}`);
      }
      ids.add(q.id);
 
      if (!("subtitle" in q) || !q.subtitle || q.subtitle.trim().length === 0) {
        console.warn(
          `[intake] question ${q.id} in step ${s.number} is missing a subtitle`,
        );
      }
 
      if (q.kind === "per_option_number") {
        const ref = (q as { dependsOn?: string }).dependsOn;
        if (!ref || !s.closeQuestions.some((c) => c.id === ref)) {
          console.warn(
            `[intake] per_option_number question ${q.id} in step ${s.number} has invalid dependsOn (${ref})`,
          );
        }
      }
    }
 
    const sentenceCount = s.lede
      .split(/[.!?]+/)
      .filter((p) => p.trim().length > 0).length;
    if (sentenceCount > 2) {
      console.warn(
        `[intake] step ${s.number} (${s.slug}) lede is ${sentenceCount} sentences (expected ≤ 2)`,
      );
    }
  }
}