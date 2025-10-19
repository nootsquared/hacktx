"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroTagline() {
  const ref = useRef(null);
  const [style, setStyle] = useState({ transform: "translate3d(0,0,0) scale(1)", opacity: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.0)));
      const translate = Math.round(progress * -24); // lift up slightly on scroll
      const scale = 1.0 + progress * 0.06; // subtle growth
      const opacity = 1 - progress * 0.08; // tiny fade
      setStyle({ transform: `translate3d(0, ${translate}px, 0) scale(${scale})`, opacity });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="mx-auto w-fit select-none">
      <div className="hero-panel">
        <h1 className="hero-tagline" style={style}>
          <span>TOYOTA&nbsp;IS&nbsp;LIFE</span>
          <span className="hero-accent">.</span>
        </h1>
      </div>
    </div>
  );
}
