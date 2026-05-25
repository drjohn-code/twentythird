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
        subtitle: "pick up to three words that feel true, even if they contradict each other — homes are usually a mix",
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
        subtitle: "think about the part you played in your family without anyone telling you to — the peacemaker, the helper, the quiet one",
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
        subtitle: "go with your gut feeling about the home, not the version the family would tell a stranger",
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
        subtitle: "not just whether feelings were there, but whether anyone actually named or talked about them out loud",
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
        subtitle: "describe one specific scene that still comes back to you — where you were, who was there, what happened, how it felt",
      },
      {
        kind: "open",
        id: "q1_6",
        number: "Q1.6",
        title: "What did you learn you had to do to receive love or approval.",
        subtitle: "the small things you noticed worked — being good, being quiet, achieving, staying out of the way — share what you remember adjusting",
      },
      {
        kind: "open",
        id: "q1_7",
        number: "Q1.7",
        title: "What emotions were difficult to express in your home.",
        subtitle: "which feelings got ignored, dismissed, or punished when you tried to show them — anger, sadness, fear, joy, anything",
      },
      {
        kind: "open",
        id: "q1_8",
        number: "Q1.8",
        title: "When you think about your younger self, what do you feel toward them.",
        subtitle: "be honest about the feeling that comes up — warmth, sadness, distance, frustration, protectiveness — whatever is actually there",
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
        subtitle: "a few sentences about what she was like, how she showed up for you, and how you felt around her",
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
        subtitle: "a few sentences about what he was like, how he showed up for you, and how you felt around him",
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
        subtitle: "where you fell in the order — oldest, middle, youngest, only child, or somewhere in between",
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
        subtitle: "beyond birth order, the role you ended up playing — the responsible one, the rebel, the invisible one, the favourite",
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
        subtitle: "name them and say what they saw in you that the other one missed or got wrong",
      },
      {
        kind: "open",
        id: "q2_6",
        number: "Q2.6",
        title: "Which parent influenced your fears the most.",
        subtitle: "whose worries you absorbed growing up, and how those fears still show up in your life today",
      },
      {
        kind: "open",
        id: "q2_7",
        number: "Q2.7",
        title: "What did conflict look like in your family.",
        subtitle: "describe the shape arguments took — yelling, silence, slammed doors, cold weeks, repeated patterns — whatever felt familiar",
      },
      {
        kind: "open",
        id: "q2_8",
        number: "Q2.8",
        title: "What kind of attention felt hardest to receive.",
        subtitle: "the kind of care that made you uncomfortable — praise, concern, physical closeness, being seen — and why it was hard",
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
        subtitle: "the actual atmosphere of the home — practices, rules, beliefs in the air — not what you believe now as an adult",
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
        subtitle: "the rule or expectation repeated so often it became background noise — about success, behaviour, image, duty, family",
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
        subtitle: "how much you feel watched or evaluated by people outside your close circle — at work, online, in public",
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
        subtitle: "the values, rules, or assumptions you inherited and still live by, even if you haven't thought about them in years",
      },
      {
        kind: "open",
        id: "q3_5",
        number: "Q3.5",
        title: "Which beliefs do you secretly resist.",
        subtitle: "the ones you go along with publicly but quietly disagree with — about money, relationships, success, gender, anything",
      },
      {
        kind: "open",
        id: "q3_6",
        number: "Q3.6",
        title: "What would your family or community disapprove of most about the real you.",
        subtitle: "the parts of yourself, your life, or your choices you keep hidden from them, and why you keep them hidden",
      },
      {
        kind: "open",
        id: "q3_7",
        number: "Q3.7",
        title: "What kind of person were you expected to become.",
        subtitle: "the future others imagined for you — career, family, behaviour, image — before you had any say in it",
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
        subtitle: "the people who have seen the unedited version of you and would not be shocked by anything in your inner life",
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
        subtitle: "the role you slide into without thinking — the funny one, the listener, the leader, the observer, the one who keeps things smooth",
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
        subtitle: "how much another person's reaction — a look, a sigh, silence — can shape what you say or do",
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
        subtitle: "the thoughts, feelings, traits, or pieces of your history you keep tucked away when you are around other people",
      },
      {
        kind: "open",
        id: "q4_5",
        number: "Q4.5",
        title: "When do you feel most accepted.",
        subtitle: "the situations or relationships where you stop performing and can just be — describe what makes those spaces different",
      },
      {
        kind: "open",
        id: "q4_6",
        number: "Q4.6",
        title: "What social situations drain you most.",
        subtitle: "the gatherings, dynamics, or relationships that leave you more tired than they should — and what about them is exhausting",
      },
      {
        kind: "open",
        id: "q4_7",
        number: "Q4.7",
        title: "What kind of people do you envy.",
        subtitle: "envy usually points at something you want but have not let yourself want openly — describe who triggers it and why",
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
        subtitle: "the apps you open out of habit, more than once a day, not the ones you technically have an account on",
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
        subtitle: "a rough estimate of how much time you actually spend on each one — minutes or hours, no judgement",
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
        subtitle: "the real reason underneath the obvious one — connection, distraction, validation, escape, comparison, information",
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
        subtitle: "how much you rehearse, second-guess, or rewrite what you share before letting other people see it",
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
        subtitle: "the quiet measuring that happens while scrolling — about looks, success, relationships, lifestyle, anything",
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
        subtitle: "describe the character you present — the curated version — and how it differs from who you are when no one is watching",
      },
      {
        kind: "open",
        id: "q5_7",
        number: "Q5.7",
        title: "What do you seek emotionally when you open social media.",
        subtitle: "the feeling you are reaching for in the moment you open the app — distraction, comfort, excitement, numbness, connection",
      },
      {
        kind: "open",
        id: "q5_8",
        number: "Q5.8",
        title: "What kind of content makes you uncomfortable.",
        subtitle: "the posts or videos that make you want to scroll past quickly, and what you think that discomfort is really about",
      },
      {
        kind: "open",
        id: "q5_9",
        number: "Q5.9",
        title: "What kind of people attract your attention online.",
        subtitle: "the accounts you stop and watch — describe the qualities they share and what draws you in",
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
        subtitle: "where you actually are right now — single, dating, partnered, married, separated, complicated — not where you wish you were",
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
        subtitle: "the ones that mattered emotionally, regardless of how long they lasted or how official they were",
        unit: "COUNT",
        min: 0,
        max: 99,
      },
      {
        kind: "multi",
        id: "q6_3",
        number: "Q6.3",
        title: "Typical conflicts in your relationships.",
        subtitle: "the arguments that keep showing up in different forms across different partners — money, distance, control, communication",
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
        subtitle: "your default move when things get hard — pull closer, pull away, take charge, shut down, try to fix",
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
        subtitle: "the type that keeps appearing in your love life — not just looks, but emotional patterns, temperament, how they treat you",
      },
      {
        kind: "open",
        id: "q6_6",
        number: "Q6.6",
        title: "What usually ends your relationships.",
        subtitle: "the real reason things fall apart, beyond the official story you tell friends or family",
      },
      {
        kind: "open",
        id: "q6_7",
        number: "Q6.7",
        title: "What emotional need do you most want fulfilled.",
        subtitle: "the need you find hardest to ask for directly — being seen, being chosen, being safe, being free, being wanted",
      },
      {
        kind: "open",
        id: "q6_8",
        number: "Q6.8",
        title: "What do you fear most in intimacy.",
        subtitle: "what closeness puts at risk for you — being known, being trapped, being left, being too much, being not enough",
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
        subtitle: "the shape of your working life right now — employed, self-employed, between jobs, studying, caregiving, something else",
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
        subtitle: "the longer arc of where your work is going, not how you feel about this particular week",
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
        subtitle: "the way you operate professionally — the role you take when no one is assigning one to you",
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
        subtitle: "the source of pressure that follows you home — a person, a workload, a fear, an environment, a pattern",
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
        subtitle: "the feeling you imagine arrives when you finally have it — relief, pride, peace, freedom, being enough",
      },
      {
        kind: "open",
        id: "q7_6",
        number: "Q7.6",
        title: "What kind of recognition affects you most.",
        subtitle: "the praise that genuinely lands and changes how you feel, and the kind that bounces off no matter how much of it you get",
      },
      {
        kind: "open",
        id: "q7_7",
        number: "Q7.7",
        title: "What failure still influences you today.",
        subtitle: "a specific failure you have not quite finished processing — what happened, and how it still shapes your choices",
      },
      {
        kind: "open",
        id: "q7_8",
        number: "Q7.8",
        title: "If money disappeared, what would you pursue.",
        subtitle: "the work or activity you would do even if no one paid you for it — describe what it looks like",
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
        subtitle: "what you reach for when things get heavy — food, screens, exercise, isolation, talking, substances, sleep, work",
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
        subtitle: "how often you spend time with other people in person, not online or through messages",
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
        subtitle: "the loneliness that shows up when you are surrounded by people but still feel unseen or far away",
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
        subtitle: "the things that pull you in so deeply that time disappears — for better or worse, healthy or not",
      },
      {
        kind: "open",
        id: "q8_5",
        number: "Q8.5",
        title: "What do you avoid thinking about most.",
        subtitle: "the topic or memory you steer away from quickly when it comes up — about yourself, your past, your future",
      },
      {
        kind: "open",
        id: "q8_6",
        number: "Q8.6",
        title: "When do you feel emotionally numb.",
        subtitle: "the situations where the volume drops to zero — work, relationships, conflict, intimacy, being alone",
      },
      {
        kind: "open",
        id: "q8_7",
        number: "Q8.7",
        title: "What habit feels hardest to stop.",
        subtitle: "the behaviour you have tried more than once to change or quit, without success — describe what it is and what keeps pulling you back",
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
        subtitle: "the tone of your inner voice when you mess up or fall short — harsh, fair, dismissive, devastating",
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
        subtitle: "the sentence about yourself that lives underneath everything else, the one you would only admit on a hard day",
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
        subtitle: "the sense of watching your own life from a small distance, like you are not fully inside it",
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
        subtitle: "the looping sentence or worry that comes back regularly — write it in its actual words, not a summary",
      },
      {
        kind: "open",
        id: "q9_5",
        number: "Q9.5",
        title: "What do you criticise yourself for privately.",
        subtitle: "the things you score yourself on that no one else knows about — about your body, mind, choices, character",
      },
      {
        kind: "open",
        id: "q9_6",
        number: "Q9.6",
        title: "What would make you feel enough.",
        subtitle: "the condition you have quietly set for yourself to finally relax — be honest, the answer is often smaller than you expect",
      },
      {
        kind: "open",
        id: "q9_7",
        number: "Q9.7",
        title: "If your inner voice had a personality, how would you describe it.",
        subtitle: "the age, gender, tone of that voice — and whose voice it might actually be, if you trace it back",
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
        subtitle: "pick the one that matters most right now — the others can still matter, but be honest about the ranking",
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
        subtitle: "the felt sense when you think ahead, not the upbeat answer you give other people when they ask",
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
        subtitle: "the want you have not quite let yourself name out loud — the one that feels too big, too risky, or too embarrassing",
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
        subtitle: "the concrete details — where you are, who you are with, what your mornings look like, the work, the light, the rhythm",
      },
      {
        kind: "open",
        id: "q10_5",
        number: "Q10.5",
        title: "What fear could destroy that future.",
        subtitle: "the thing — internal or external — that has stopped you before, and could stop you again if you let it",
      },
      {
        kind: "open",
        id: "q10_6",
        number: "Q10.6",
        title: "What part of yourself are you still trying to become.",
        subtitle: "the version of you on the horizon — the qualities, the freedoms, the way of being you are slowly moving toward",
      },
      {
        kind: "open",
        id: "q10_7",
        number: "Q10.7",
        title: "If nobody judged you, how would you live differently.",
        subtitle: "the choices you would make if the watching stopped — about work, love, body, time, money, voice",
      },
      {
        kind: "open",
        id: "q10_8",
        number: "Q10.8",
        title: "What do you think you are truly searching for.",
        subtitle: "the deeper thing underneath all your previous answers — what every choice and longing is really pointing at",
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