"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const t = useTranslations("marketing.contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const successRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus();
    }
  }, [status]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="contact-success"
        role="status"
        aria-live="polite"
      >
        <span className="eyebrow">{t("form.successEyebrow")}</span>
        <h3>
          {t("form.successHeadlineLead")} <em>{t("form.successHeadlineItalic")}</em>.
        </h3>
        <p>{t("form.successBody")}</p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="field-group">
        <Field id="contact-name" label={t("form.nameLabel")}>
          <Input
            id="contact-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            required
            aria-required="true"
            autoComplete="name"
          />
        </Field>

        <Field id="contact-email" label={t("form.emailLabel")}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            aria-required="true"
            autoComplete="email"
          />
        </Field>

        <Field id="contact-message" label={t("form.messageLabel")}>
          <Textarea
            id="contact-message"
            name="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            required
            aria-required="true"
          />
        </Field>

        <div className="contact-submit">
          <button type="submit" className="cta" disabled={submitting}>
            <span>{submitting ? t("form.submitSending") : t("form.submitSend")}</span>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
          {status === "error" ? (
            <p className="contact-error">{t("form.errorMessage")}</p>
          ) : null}
        </div>

        <span className="contact-status-vh" aria-live="polite">
          {submitting ? t("form.submittingStatus") : ""}
        </span>
      </div>
    </form>
  );
}
