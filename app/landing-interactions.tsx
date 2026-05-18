"use client";

import { useEffect } from "react";

export default function LandingInteractions() {
  useEffect(() => {
    const pin = document.querySelector(".brain-pin") as HTMLElement | null;
    const states = document.querySelectorAll(".brain-state");
    const pips = document.querySelectorAll(".brain-progress .pip");

    let raf: number | null = null;
    const updateBrain = () => {
      if (!pin || !states.length) return;
      const rect = pin.getBoundingClientRect();
      const total = pin.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      let idx = 0;
      if (progress > 0.66) idx = 2;
      else if (progress > 0.33) idx = 1;
      states.forEach((s, i) => s.classList.toggle("active", i === idx));
      pips.forEach((p, i) => {
        p.classList.toggle("active", i === idx);
        p.classList.toggle("done", i < idx);
      });
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        updateBrain();
        raf = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateBrain();

    const fades = document.querySelectorAll<HTMLElement>("[data-fade]");
    const onFade = () => {
      fades.forEach((el) => {
        const r = el.getBoundingClientRect();
        const h = window.innerHeight;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - h / 2) / h;
        const opacity = Math.max(0, 1 - dist * 0.9);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${dist * 30}px)`;
      });
    };
    window.addEventListener("scroll", onFade, { passive: true });
    onFade();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onFade);
    };
  }, []);

  return null;
}
