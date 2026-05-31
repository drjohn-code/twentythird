"use client";

import { useTranslations } from "next-intl";
import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";

// Safety response block — rendered inline when a high or critical
// safety flag fires in catchup, session, or post-intake. The visual
// grammar matches the rest of Room: hairline-bordered glass, no
// color, no alarm.
//
// The resources list is region-neutral by design. Hardcoding a US or
// UK number first would be wrong for half the audience; instead we
// list a small set of international references and tell the user to
// contact local emergency services.

export type SafetyResponseContext = "intake" | "catchup" | "session";

type SafetyResponseProps = {
  context?: SafetyResponseContext;
  /** When true, render the inline resources panel rather than a link. */
  showResources?: boolean;
};

export default function SafetyResponse({
  context = "session",
  showResources = false,
}: SafetyResponseProps) {
  const t = useTranslations("safety");

  return (
    <Glass
      as="aside"
      className="safety-response"
      role="note"
      aria-label={t("noteAria")}
    >
      <Eyebrow>{t("noteEyebrow")}</Eyebrow>
      <p className="safety-response__lede">
        <em>{t("lede")}</em>
      </p>
      <p className="safety-response__body">{t(`body.${context}`)}</p>

      {showResources ? (
        <div className="safety-response__resources">
          <Eyebrow as="div">{t("crisisResources")}</Eyebrow>
          <ul className="safety-response__list">
            <li>
              <span className="safety-response__loc">{t("resources.us")}</span>
              <span className="safety-response__num">988</span>
            </li>
            <li>
              <span className="safety-response__loc">{t("resources.ukIe")}</span>
              <span className="safety-response__num">116 123 (Samaritans)</span>
            </li>
            <li>
              <span className="safety-response__loc">{t("resources.europe")}</span>
              <span className="safety-response__num">112</span>
            </li>
            <li>
              <span className="safety-response__loc">{t("resources.everywhere")}</span>
              <span className="safety-response__num">{t("resources.localEmergency")}</span>
            </li>
          </ul>
          <p className="safety-response__hint">
            <em>{t("hintResources")}</em>
          </p>
        </div>
      ) : (
        <p className="safety-response__hint">
          <em>{t("hintLink")}</em>
        </p>
      )}
    </Glass>
  );
}
