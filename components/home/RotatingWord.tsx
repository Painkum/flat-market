"use client";

import { useEffect, useState } from "react";

export function RotatingWord({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="relative inline-block">
      <span className="sr-only">{words.join(", ")}</span>
      <span key={index} aria-hidden="true" className="inline-block animate-word text-accent italic">
        {words[index]}
      </span>
    </span>
  );
}
