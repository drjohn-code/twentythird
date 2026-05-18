"use client";

import { useEffect } from "react";

export default function SiteInteractions() {
  useEffect(() => {
    const root = document.documentElement;

    const btn = document.getElementById("themeToggle");
    const onToggle = () => {
      const cur = root.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {}
    };
    btn?.addEventListener("click", onToggle);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.18 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.18 },
    );
    document.querySelectorAll(".split-section").forEach((el) => io2.observe(el));

    return () => {
      btn?.removeEventListener("click", onToggle);
      io.disconnect();
      io2.disconnect();
    };
  }, []);

  return null;
}
