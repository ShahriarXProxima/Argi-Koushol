"use client";

import * as React from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "en-US",
  className,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = React.useState<number>(value);
  const prevValueRef = React.useRef<number>(value);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    const diff = endVal - startVal;

    if (diff === 0) return;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = React.useMemo(() => {
    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const valToFormat = isReduced ? value : displayValue;

    try {
      const numFormatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(valToFormat);
      return `${prefix}${numFormatted}${suffix}`;
    } catch {
      return `${prefix}${valToFormat.toFixed(decimals)}${suffix}`;
    }
  }, [displayValue, value, decimals, locale, prefix, suffix]);

  return <span className={className}>{formatted}</span>;
}
