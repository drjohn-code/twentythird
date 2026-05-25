import "server-only";

// ISO-8601 week string formatter — used by the weekly-catchup-reminder
// scheduler and by the partial-unique index on scheduled_emails. The
// week the user is "in" right now is whichever ISO week contains today
// (their local timezone). Returns 'YYYY-Www' (e.g. '2026-W21').

export function isoWeekString(d: Date): string {
  // Copy so we don't mutate the caller's date.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ISO week day: Mon=1..Sun=7. Shift to the Thursday of the current
  // week — ISO weeks are anchored on the Thursday.
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  // Year of the anchoring Thursday is the ISO year.
  const isoYear = date.getUTCFullYear();
  // Week number = days since Jan 4 (always in week 1) / 7, +1.
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}
