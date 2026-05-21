"use client";

import { useEffect } from "react";

/** Forces the viewport to the page top on mount. Counters mobile Safari's
 *  aggressive scroll restoration on routes that should always land at the
 *  top (intake brief lands mid-page otherwise). */
export default function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return null;
}
