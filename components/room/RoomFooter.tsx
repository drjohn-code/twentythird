import { getTranslations } from "next-intl/server";

/**
 * Always rendered at the bottom of every Room page. The crisis safety
 * note is required — do not remove it. The bottom strip is intentionally
 * minimal: Room is not the marketing site.
 */
export default async function RoomFooter() {
  const t = await getTranslations("safety");
  return (
    <footer className="room-footer">
      <p className="room-footer-safety">{t("footerLine")}</p>
      <div className="room-footer-bot">
        <span>© 2026 WelloWork AB</span>
        <span>twentythird · {t("footerRoomLabel")}</span>
      </div>
    </footer>
  );
}
