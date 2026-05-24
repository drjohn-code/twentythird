/**
 * Always rendered at the bottom of every Room page. The crisis safety
 * note is required — do not remove it. The bottom strip is intentionally
 * minimal: Room is not the marketing site.
 */
export default function RoomFooter() {
  return (
    <footer className="room-footer">
      <p className="room-footer-safety">
        TwentyThird is not a substitute for clinical care. In crisis,
        contact your local emergency line.
      </p>
      <div className="room-footer-bot">
        <span>© 2026 WelloWork AB</span>
        <span>twentythird · the room</span>
      </div>
    </footer>
  );
}
