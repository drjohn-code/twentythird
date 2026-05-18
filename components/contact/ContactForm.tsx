"use client";

import { useState, type FormEvent } from "react";

type InquiryType = "general" | "clinical" | "press" | "partnership" | "research";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>("general");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, inquiryType, message, company }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <p className="contact-success">
        <em>Received. We&apos;ll be in touch.</em>
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="field-group">
        <div className="field">
          <label htmlFor="contact-name" className="field-label">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            aria-required
            autoComplete="name"
            className="field-input"
          />
        </div>

        <div className="field">
          <label htmlFor="contact-email" className="field-label">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            aria-required
            autoComplete="email"
            className="field-input"
          />
        </div>

        <div className="field">
          <label htmlFor="contact-type" className="field-label">
            Inquiry
          </label>
          <div className="field-select-wrap">
            <select
              id="contact-type"
              name="inquiryType"
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value as InquiryType)}
              className="field-input field-select"
            >
              <option value="general">General</option>
              <option value="clinical">Clinical inquiry</option>
              <option value="press">Press</option>
              <option value="partnership">Partnership</option>
              <option value="research">Research</option>
            </select>
            <span className="field-select-caret" aria-hidden="true">
              ↓
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="contact-message" className="field-label">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={10}
            maxLength={4000}
            required
            aria-required
            aria-describedby={error ? "contact-error" : undefined}
            className="field-input field-textarea"
          />
        </div>

        <input
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hp-field"
          aria-hidden="true"
        />

        {status === "error" && error && (
          <p id="contact-error" className="contact-error">
            {error}
          </p>
        )}

        <div className="contact-submit">
          <button
            type="submit"
            className="cta"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending" : "Send"}
            <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </form>
  );
}
