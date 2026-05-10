"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/**
 * Bundles AOS (Animate On Scroll) from the local npm package instead of
 * loading it from a third-party CDN. This keeps us inside our own CSP and
 * avoids depending on unpkg availability/integrity.
 */
export default function AnimationProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    AOS.init({ offset: 1, once: true });
  }, []);

  return null;
}
