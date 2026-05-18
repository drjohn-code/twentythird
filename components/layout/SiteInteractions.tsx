"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteInteractions() {
  const pathname = usePathname();

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

    const reveal = (el: Element) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("in");
        return true;
      }
      return false;
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io2.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );

    const raf = requestAnimationFrame(() => {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (!reveal(el)) io.observe(el);
      });
      document.querySelectorAll(".split-section").forEach((el) => {
        if (!reveal(el)) io2.observe(el);
      });
    });

    return () => {
      btn?.removeEventListener("click", onToggle);
      cancelAnimationFrame(raf);
      io.disconnect();
      io2.disconnect();
    };
  }, [pathname]);

  return null;
}
