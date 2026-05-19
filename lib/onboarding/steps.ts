// The ten intake sections. Single source of truth for copy and the
// question grid. The page at /onboarding/intake/[step] reads from
// this — there is no per-step page file.
//
// Editing rules:
//   - Each headline contains exactly one italic segment.
//   - No: "we believe", "imagine", "unlock", "journey", "Project 23",
//     no wellness clichés.
//   - Question ids are q{step}_{n} and must stay stable across deploys —
//   the analysis worker keys off them. If you must rename, also write a
//   migration that moves the jsonb keys forward.
//   - Each step has 4–6 close questions + 1–3 open. Keep it tight.

import type { StepDef } from "@/lib/types/intake";

export const TOTAL_STEPS = 10 as const;

const STEPS_INTERNAL: StepDef[] = [
  // ─────────────────────────────────────────────────────────
  // 01 — ORIGINS
  // ─────────────────────────────────────────────────────────
  {
    number: 1,
    slug: "origins",
    eyebrow: "SECTION 01 · ORIGINS · DEVELOPMENTAL IMPRINTING",
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
        kind: "single",
        id: "q1_1",
        number: "Q1.1",
        title: "Which best describes the home you grew up in.",
        layout: "vertical",
        options: [
          { value: "two_parent_stable", label: "Two-parent, stable" },
          { value: "two_parent_tense", label: "Two-parent, often tense" },
          { value: "single_parent", label: "Single parent" },
          { value: "extended_family", label: "Extended family or relatives" },
          { value: "blended", label: "Blended after separation" },
          { value: "institutional", label: "Foster, group, or institutional care" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        kind: "single",
        id: "q1_2",
        number: "Q1.2",
        title: "The role you were cast in as a child.",
        layout: "vertical",
        options: [
          { value: "responsible_one", label: "The responsible one" },
          { value: "easy_one", label: "The easy one" },
          { value: "difficult_one", label: "The difficult one" },
          { value: "invisible_one", label: "The invisible one" },
          { value: "golden_child", label: "The golden child" },
          { value: "peacemaker", label: "The peacemaker" },
          { value: "caregiver", label: "The one who looked after others" },
        ],
      },
      {
        kind: "single",
        id: "q1_3",
        number: "Q1.3",
        title: "Were emotions openly discussed at home.",
        layout: "horizontal",
        options: [
          { value: "frequently", label: "Frequently" },
          { value: "sometimes", label: "Sometimes" },
          { value: "rarely", label: "Rarely" },
          { value: "never", label: "Never" },
        ],
      },
      {
        kind: "scale",
        id: "q1_4",
        number: "Q1.4",
        title: "How safe did that room feel.",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER SAFE",
        highLabel: "10 · FULLY SAFE",
      },
      {
        kind: "scale",
        id: "q1_5",
        number: "Q1.5",
        title: "How present was shame in your early years.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q1_6",
        number: "Q1.6",
        title: "Describe the room you remember most. What was in it, who was in it, what was the air like.",
      },
      {
        kind: "open",
        id: "q1_7",
        number: "Q1.7",
        title: "The earliest moment you knew you were not allowed to need something.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 02 — ATTACHMENT
  // ─────────────────────────────────────────────────────────
  {
    number: 2,
    slug: "attachment",
    eyebrow: "SECTION 02 · ATTACHMENT · FAMILY STRUCTURE",
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
        kind: "single",
        id: "q2_1",
        number: "Q2.1",
        title: "Who was the primary caregiver.",
        layout: "vertical",
        options: [
          { value: "mother", label: "Mother" },
          { value: "father", label: "Father" },
          { value: "both_parents", label: "Both parents, equally" },
          { value: "grandparent", label: "Grandparent" },
          { value: "sibling", label: "An older sibling" },
          { value: "non_relative", label: "A non-relative" },
          { value: "no_consistent", label: "No consistent caregiver" },
        ],
      },
      {
        kind: "single",
        id: "q2_2",
        number: "Q2.2",
        title: "When you were upset as a child, what usually happened.",
        layout: "vertical",
        options: [
          { value: "comforted", label: "I was comforted" },
          { value: "ignored", label: "I was ignored" },
          { value: "told_to_stop", label: "I was told to stop" },
          { value: "punished", label: "I was punished" },
          { value: "dealt_alone", label: "I dealt with it alone" },
        ],
      },
      {
        kind: "single",
        id: "q2_3",
        number: "Q2.3",
        title: "Which best describes you in adult relationships.",
        layout: "vertical",
        options: [
          { value: "secure", label: "I lean in and trust without much effort" },
          { value: "anxious", label: "I worry I'll be left and pursue closeness" },
          { value: "avoidant", label: "I keep distance, even when I want closeness" },
          { value: "disorganised", label: "I want closeness and fear it at the same time" },
        ],
      },
      {
        kind: "scale",
        id: "q2_4",
        number: "Q2.4",
        title: "How easily can you ask for help.",
        min: 1,
        max: 10,
        lowLabel: "1 · CANNOT",
        highLabel: "10 · EASILY",
      },
      {
        kind: "number",
        id: "q2_5",
        number: "Q2.5",
        title: "How many serious relationships have you been in.",
        unit: "COUNT",
        min: 0,
        max: 99,
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q2_6",
        number: "Q2.6",
        title: "Describe the bond that taught you the most about being close to someone — for better or worse.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 03 — AUTHORITY
  // ─────────────────────────────────────────────────────────
  {
    number: 3,
    slug: "authority",
    eyebrow: "SECTION 03 · AUTHORITY · SYMBOLIC LAW",
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
        kind: "multi",
        id: "q3_1",
        number: "Q3.1",
        title: "Which of these were emphasised in your upbringing. Pick all that apply.",
        options: [
          { value: "religion", label: "Religion or faith" },
          { value: "achievement", label: "Achievement" },
          { value: "obedience", label: "Obedience" },
          { value: "appearances", label: "Appearances" },
          { value: "loyalty", label: "Loyalty to the family" },
          { value: "self_reliance", label: "Self-reliance" },
          { value: "kindness", label: "Kindness" },
          { value: "discipline", label: "Discipline" },
          { value: "intellect", label: "Intellect" },
          { value: "none", label: "None of these" },
        ],
      },
      {
        kind: "single",
        id: "q3_2",
        number: "Q3.2",
        title: "How was discipline delivered.",
        layout: "vertical",
        options: [
          { value: "explained", label: "Explained and proportional" },
          { value: "withheld", label: "Through withheld affection" },
          { value: "shaming", label: "Through shaming" },
          { value: "physical", label: "Physically" },
          { value: "rare", label: "Rarely, almost never" },
        ],
      },
      {
        kind: "scale",
        id: "q3_3",
        number: "Q3.3",
        title: "How present is guilt in your day.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
      {
        kind: "scale",
        id: "q3_4",
        number: "Q3.4",
        title: "How much do you still measure yourself against a parent's standard.",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT AT ALL",
        highLabel: "10 · DAILY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q3_5",
        number: "Q3.5",
        title: "Quote a line — from a parent, a teacher, a faith — that still arrives unbidden.",
      },
      {
        kind: "open",
        id: "q3_6",
        number: "Q3.6",
        title: "What is the rule you live by that you didn't choose.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 04 — BELONGING
  // ─────────────────────────────────────────────────────────
  {
    number: 4,
    slug: "belonging",
    eyebrow: "SECTION 04 · BELONGING · SOCIAL IDENTITY",
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
        kind: "scale",
        id: "q4_1",
        number: "Q4.1",
        title: "How important is being part of a group to your sense of self.",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT AT ALL",
        highLabel: "10 · ESSENTIAL",
      },
      {
        kind: "single",
        id: "q4_2",
        number: "Q4.2",
        title: "When your views differ from your circle, what usually happens.",
        layout: "vertical",
        options: [
          { value: "say_it", label: "I say it" },
          { value: "soften", label: "I soften it" },
          { value: "stay_quiet", label: "I stay quiet" },
          { value: "leave_room", label: "I leave the room" },
        ],
      },
      {
        kind: "scale",
        id: "q4_3",
        number: "Q4.3",
        title: "How much of yourself do you adjust for the room you are in.",
        min: 1,
        max: 10,
        lowLabel: "1 · NONE",
        highLabel: "10 · ALL OF IT",
      },
      {
        kind: "scale",
        id: "q4_4",
        number: "Q4.4",
        title: "How present is the fear of being excluded.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q4_5",
        number: "Q4.5",
        title: "Describe a group you wanted to belong to. What did you adjust to be allowed in.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 05 — PERSONA
  // ─────────────────────────────────────────────────────────
  {
    number: 5,
    slug: "persona",
    eyebrow: "SECTION 05 · PERSONA · DESIRE & DIGITAL SELF",
    headline: [
      { text: "The self you " },
      { text: "perform", italic: true },
      { text: "." },
    ],
    lede:
      "Reads the idealised self, the validation loop, and the symbolic performance you stage online. The persona is not a lie; it is a half-revealed wish.",
    estMinutes: 11,
    closeQuestions: [
      {
        kind: "multi",
        id: "q5_1",
        number: "Q5.1",
        title: "Which platforms do you actively use.",
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
        kind: "number",
        id: "q5_2",
        number: "Q5.2",
        title: "Average daily usage across all platforms.",
        unit: "MINUTES PER DAY",
        min: 0,
        max: 1440,
      },
      {
        kind: "single",
        id: "q5_3",
        number: "Q5.3",
        title: "When you post, what is the underlying hope.",
        layout: "vertical",
        options: [
          { value: "to_be_seen", label: "To be seen" },
          { value: "to_be_admired", label: "To be admired" },
          { value: "to_be_understood", label: "To be understood" },
          { value: "to_stay_connected", label: "To stay connected" },
          { value: "to_provoke", label: "To provoke" },
          { value: "rarely_post", label: "I rarely post" },
        ],
      },
      {
        kind: "scale",
        id: "q5_4",
        number: "Q5.4",
        title: "How aligned is the self you show online with the one you live with.",
        min: 1,
        max: 10,
        lowLabel: "1 · NOT ALIGNED",
        highLabel: "10 · IDENTICAL",
      },
      {
        kind: "scale",
        id: "q5_5",
        number: "Q5.5",
        title: "How much does external validation affect your mood.",
        min: 1,
        max: 10,
        lowLabel: "1 · NONE",
        highLabel: "10 · COMPLETELY",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q5_6",
        number: "Q5.6",
        title: "Describe the version of you that lives online. What does it want that the offline you cannot ask for.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 06 — DESIRE
  // ─────────────────────────────────────────────────────────
  {
    number: 6,
    slug: "desire",
    eyebrow: "SECTION 06 · DESIRE · INTIMACY & REPETITION",
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
        title: "The type of partner you keep finding yourself drawn to.",
        layout: "vertical",
        options: [
          { value: "emotionally_unavailable", label: "Emotionally unavailable" },
          { value: "intensely_attentive", label: "Intensely attentive" },
          { value: "needs_fixing", label: "Someone who needs fixing" },
          { value: "much_older_younger", label: "Much older or younger than me" },
          { value: "reminds_of_parent", label: "Someone who reminds me of a parent" },
          { value: "stable_steady", label: "Stable and steady" },
          { value: "varied", label: "No clear type" },
        ],
      },
      {
        kind: "scale",
        id: "q6_2",
        number: "Q6.2",
        title: "How often do your relationships follow a similar arc.",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · ALWAYS",
      },
      {
        kind: "scale",
        id: "q6_3",
        number: "Q6.3",
        title: "How present is the fear of being left.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
      {
        kind: "scale",
        id: "q6_4",
        number: "Q6.4",
        title: "How present is the fear of being fully known.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
      {
        kind: "single",
        id: "q6_5",
        number: "Q6.5",
        title: "Who usually ends your relationships.",
        layout: "horizontal",
        options: [
          { value: "me", label: "Me" },
          { value: "them", label: "Them" },
          { value: "mutual", label: "Mutual" },
          { value: "drift", label: "They drift apart" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q6_6",
        number: "Q6.6",
        title: "Describe the relationship pattern you can now see in hindsight. When did you first notice it.",
      },
      {
        kind: "open",
        id: "q6_7",
        number: "Q6.7",
        title: "What do you want from intimacy that you have never quite been able to ask for.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 07 — ACHIEVEMENT
  // ─────────────────────────────────────────────────────────
  {
    number: 7,
    slug: "achievement",
    eyebrow: "SECTION 07 · ACHIEVEMENT · WORK & RECOGNITION",
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
        title: "What primarily drives you at work.",
        layout: "vertical",
        options: [
          { value: "recognition", label: "Recognition" },
          { value: "mastery", label: "Mastery of the craft" },
          { value: "money", label: "Money or security" },
          { value: "freedom", label: "Freedom and autonomy" },
          { value: "impact", label: "Impact on others" },
          { value: "approval", label: "Approval from someone specific" },
          { value: "fear_of_falling_behind", label: "Fear of falling behind" },
        ],
      },
      {
        kind: "scale",
        id: "q7_2",
        number: "Q7.2",
        title: "How much of your worth is tied to what you produce.",
        min: 1,
        max: 10,
        lowLabel: "1 · NONE",
        highLabel: "10 · ALL OF IT",
      },
      {
        kind: "scale",
        id: "q7_3",
        number: "Q7.3",
        title: "How present is imposter syndrome.",
        min: 1,
        max: 10,
        lowLabel: "1 · ABSENT",
        highLabel: "10 · CONSTANT",
      },
      {
        kind: "single",
        id: "q7_4",
        number: "Q7.4",
        title: "Your usual stance toward authority figures at work.",
        layout: "vertical",
        options: [
          { value: "defer", label: "I defer" },
          { value: "challenge", label: "I challenge" },
          { value: "perform_for", label: "I perform for them" },
          { value: "avoid", label: "I avoid them" },
          { value: "negotiate", label: "I treat them as peers" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q7_5",
        number: "Q7.5",
        title: "Whose recognition would feel like enough. What would they have to say.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 08 — ESCAPE
  // ─────────────────────────────────────────────────────────
  {
    number: 8,
    slug: "escape",
    eyebrow: "SECTION 08 · ESCAPE · PLEASURE & RITUAL",
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
        title: "Which of these do you turn to when you want to leave the present moment.",
        options: [
          { value: "alcohol", label: "Alcohol" },
          { value: "cannabis", label: "Cannabis" },
          { value: "other_substances", label: "Other substances" },
          { value: "scrolling", label: "Scrolling" },
          { value: "tv", label: "Television or streaming" },
          { value: "porn", label: "Pornography" },
          { value: "food", label: "Food" },
          { value: "shopping", label: "Shopping" },
          { value: "work", label: "Working harder" },
          { value: "exercise", label: "Exercise" },
          { value: "sleep", label: "Sleep" },
          { value: "none", label: "None of these" },
        ],
      },
      {
        kind: "scale",
        id: "q8_2",
        number: "Q8.2",
        title: "How automatic does that reaching feel.",
        min: 1,
        max: 10,
        lowLabel: "1 · DELIBERATE",
        highLabel: "10 · AUTOMATIC",
      },
      {
        kind: "single",
        id: "q8_3",
        number: "Q8.3",
        title: "What feeling most often precedes it.",
        layout: "vertical",
        options: [
          { value: "anxiety", label: "Anxiety" },
          { value: "boredom", label: "Boredom" },
          { value: "loneliness", label: "Loneliness" },
          { value: "anger", label: "Anger" },
          { value: "sadness", label: "Sadness" },
          { value: "emptiness", label: "Emptiness" },
          { value: "exhaustion", label: "Exhaustion" },
        ],
      },
      {
        kind: "scale",
        id: "q8_4",
        number: "Q8.4",
        title: "Afterwards, how often do you feel worse.",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · ALWAYS",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q8_5",
        number: "Q8.5",
        title: "Describe the ritual in detail — the moment you start, the place, the order of things.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 09 — SELF-RELATION
  // ─────────────────────────────────────────────────────────
  {
    number: 9,
    slug: "self-relation",
    eyebrow: "SECTION 09 · SELF-RELATION · INTERNAL DIALOGUE",
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
        kind: "single",
        id: "q9_1",
        number: "Q9.1",
        title: "Which best describes the tone of your inner voice.",
        layout: "vertical",
        options: [
          { value: "kind", label: "Kind and patient" },
          { value: "neutral", label: "Neutral, mostly factual" },
          { value: "critical", label: "Critical" },
          { value: "harsh", label: "Harsh" },
          { value: "contemptuous", label: "Contemptuous" },
          { value: "varies", label: "Varies wildly" },
        ],
      },
      {
        kind: "scale",
        id: "q9_2",
        number: "Q9.2",
        title: "How often do you replay something you said or did.",
        min: 1,
        max: 10,
        lowLabel: "1 · NEVER",
        highLabel: "10 · CONSTANTLY",
      },
      {
        kind: "scale",
        id: "q9_3",
        number: "Q9.3",
        title: "How much of your shame is recognisably someone else's voice.",
        min: 1,
        max: 10,
        lowLabel: "1 · NONE",
        highLabel: "10 · ALL OF IT",
      },
      {
        kind: "single",
        id: "q9_4",
        number: "Q9.4",
        title: "When you fail at something small, what is the first thing the voice says.",
        layout: "vertical",
        options: [
          { value: "try_again", label: "Try again" },
          { value: "of_course", label: "Of course you did" },
          { value: "you_are_stupid", label: "You are stupid" },
          { value: "people_will_know", label: "People will know" },
          { value: "you_are_a_fraud", label: "You are a fraud" },
          { value: "doesnt_matter", label: "It doesn't matter" },
        ],
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q9_5",
        number: "Q9.5",
        title: "Whose voice is it. Write what they would say in the room with you, word for word.",
      },
      {
        kind: "open",
        id: "q9_6",
        number: "Q9.6",
        title: "What would it mean to disagree with them, out loud, today.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 10 — FUTURE · FANTASY, FEAR & DESIRE
  // ─────────────────────────────────────────────────────────
  {
    number: 10,
    slug: "future-fantasy",
    eyebrow: "SECTION 10 · FUTURE · FANTASY, FEAR & DESIRE",
    headline: [
      { text: "What you are " },
      { text: "truly searching for", italic: true },
      { text: "." },
    ],
    lede:
      "The emotional climax — the future you imagine, the fear that haunts it, the core desire underneath. The last question is the first one returned.",
    estMinutes: 14,
    closeQuestions: [
      {
        kind: "single",
        id: "q10_1",
        number: "Q10.1",
        title: "If everything went well, what would the centre of your life be in five years.",
        layout: "vertical",
        options: [
          { value: "love", label: "Love and a household" },
          { value: "craft", label: "A craft I have given everything to" },
          { value: "freedom", label: "Freedom and movement" },
          { value: "service", label: "Service to others" },
          { value: "stillness", label: "Stillness and a quiet room" },
          { value: "recognition", label: "Recognition for what I made" },
          { value: "family_of_origin", label: "Repair with the family I came from" },
        ],
      },
      {
        kind: "scale",
        id: "q10_2",
        number: "Q10.2",
        title: "How vivid is that future when you picture it.",
        min: 1,
        max: 10,
        lowLabel: "1 · VAGUE",
        highLabel: "10 · CINEMATIC",
      },
      {
        kind: "single",
        id: "q10_3",
        number: "Q10.3",
        title: "The fear underneath that future.",
        layout: "vertical",
        options: [
          { value: "wont_arrive", label: "It will not arrive" },
          { value: "will_arrive_alone", label: "It will arrive and I will be alone" },
          { value: "will_not_be_enough", label: "It will arrive and not be enough" },
          { value: "will_not_deserve", label: "I will not deserve it when it does" },
          { value: "will_lose_it", label: "I will lose it once I have it" },
        ],
      },
      {
        kind: "scale",
        id: "q10_4",
        number: "Q10.4",
        title: "How permitted do you feel to want it.",
        min: 1,
        max: 10,
        lowLabel: "1 · FORBIDDEN",
        highLabel: "10 · ALREADY ALLOWED",
      },
    ],
    openQuestions: [
      {
        kind: "open",
        id: "q10_5",
        number: "Q10.5",
        title: "Describe a day in that life — what you do in the morning, who is there, what the light looks like.",
      },
      {
        kind: "open",
        id: "q10_6",
        number: "Q10.6",
        title: "What is the thing you have wanted, since you were very young, that you have still not said out loud.",
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

if (process.env.NODE_ENV !== "production") {
  for (const s of STEPS_INTERNAL) {
    const italics = s.headline.filter((seg) => seg.italic).length;
    if (italics !== 1) {
      console.warn(
        `[intake] step ${s.number} (${s.slug}) has ${italics} italic segments (expected 1)`,
      );
    }
    const ids = new Set<string>();
    for (const q of [...s.closeQuestions, ...s.openQuestions]) {
      if (ids.has(q.id)) {
        console.warn(`[intake] duplicate question id ${q.id} in step ${s.number}`);
      }
      ids.add(q.id);
    }
  }
}
