import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import SessionView from "@/components/room/SessionView";

// ────────────────────────────────────────────────────────────────────
// /consulting — the Consulting Room.
//
// Subscription-gated. Unsubscribed users see the offer state and a
// single CTA → /subscribe/confirm (Phase 7 wires the Stripe call).
// Subscribed users see SessionView, initialized with a resumed open
// session if one exists, otherwise the held-question + topic chips.
// ────────────────────────────────────────────────────────────────────

const SOFT_MAX_DURATION_SECONDS = 2 * 60 * 60;

type SessionRow = {
  id: string;
  topic: string | null;
  held_question: string;
  transcript: Turn[];
  closed_at: string | null;
  duration_seconds: number;
  created_at: string;
};
type Turn = { role: "user" | "analyst" | "system"; text: string; at: string };

type SubscriptionRow = { status: string | null };

type SessionMetaRow = {
  held_question: string | null;
  topic: string | null;
  closed_at: string | null;
};

type CatchupRow = {
  answers: Record<string, unknown> | null;
  week_number: number;
};

export default async function ConsultingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // (room) layout has already guaranteed a session.
  if (!user) return null;

  const [subRes, openSessionRes, lastClosedSessionRes, lastCatchupRes] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle<SubscriptionRow>(),
      supabase
        .from("sessions")
        .select(
          "id, topic, held_question, transcript, closed_at, duration_seconds, created_at",
        )
        .eq("user_id", user.id)
        .is("closed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<SessionRow>(),
      supabase
        .from("sessions")
        .select("held_question, topic, closed_at")
        .eq("user_id", user.id)
        .not("closed_at", "is", null)
        .order("closed_at", { ascending: false })
        .limit(1)
        .maybeSingle<SessionMetaRow>(),
      supabase
        .from("catchups")
        .select("answers, week_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<CatchupRow>(),
    ]);

  const isSubscribed = subRes.data?.status === "active";

  if (!isSubscribed) {
    return <UnsubscribedState />;
  }

  const openSession = openSessionRes.data ?? null;
  const heldQuestion =
    openSession?.held_question?.trim()
      ? openSession.held_question
      : deriveHeldQuestion(
          lastClosedSessionRes.data ?? null,
          lastCatchupRes.data ?? null,
        );

  return (
    <Reveal as="section" className="room-section room-section-tight">
      <Eyebrow>CONSULTING ROOM</Eyebrow>
      <SessionView
        initialSession={openSession}
        heldQuestion={heldQuestion}
        softMaxSeconds={SOFT_MAX_DURATION_SECONDS}
      />
    </Reveal>
  );
}

// ────────────────────────────────────────────────────────────────────
// Unsubscribed offer state
// ────────────────────────────────────────────────────────────────────

function UnsubscribedState() {
  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>CONSULTING ROOM</Eyebrow>
      <h1 className="consulting-offer-h">
        The consulting room<span className="it">.</span>
      </h1>
      <p className="consulting-offer-lede">
        A long-form sitting with the analyst, held in the same voice as
        your readings. Sessions are private, kept in the case file, and
        feed the readings between sittings.
      </p>
      <p className="consulting-offer-lede consulting-offer-lede-second">
        Subscribers receive one clinical report each month.
      </p>
      <div className="consulting-offer-cta">
        <CTA href="/subscribe/confirm">Enter the consulting room</CTA>
        <RowLink href="/readings">return to the readings</RowLink>
      </div>
    </Reveal>
  );
}

// ────────────────────────────────────────────────────────────────────
// Held question — server-side derivation. Mirrors the logic in the
// session route's start handler so what the user sees on the page is
// what gets written when the first turn opens a new session row.
// ────────────────────────────────────────────────────────────────────

function deriveHeldQuestion(
  lastSession: SessionMetaRow | null,
  lastCatchup: CatchupRow | null,
): string {
  if (lastSession?.held_question && lastSession.held_question.trim()) {
    return lastSession.held_question;
  }

  if (lastCatchup?.answers) {
    const stayed = stringField(lastCatchup.answers, "stayed_with");
    const workCatch = stringField(lastCatchup.answers, "work_catch");
    const avoided = stringField(lastCatchup.answers, "avoided_question");
    if (workCatch && workCatch !== "nowhere") {
      return `last week you said work catches you at the ${workCatch}. shall we begin there?`;
    }
    if (avoided) {
      return `the question you would not answer last week — do you want to sit with it now?`;
    }
    if (stayed) {
      return `something from last week is still in the room. shall we open it?`;
    }
  }

  return "what would you like to begin with today?";
}

function stringField(o: Record<string, unknown>, k: string): string {
  const v = o[k];
  return typeof v === "string" ? v.trim() : "";
}
