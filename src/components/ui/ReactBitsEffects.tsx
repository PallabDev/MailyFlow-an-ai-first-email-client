"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/* ─── 1. ShinyText Component ────────────────────────────────── */

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text bg-[length:200%_auto] ${
        disabled ? "" : "animate-shiny"
      } ${className}`}
      style={{
        animationDuration,
        backgroundImage: "var(--shiny-gradient, linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 70%))",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundColor: "var(--shiny-base-color, currentColor)",
      }}
    >
      {text}
    </span>
  );
}

/* ─── 2. TiltedCard Component ───────────────────────────────── */

export function TiltedCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring configurations for smooth card tilt response
  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), springConfig);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── 3. SpotlightCard Component ────────────────────────────── */

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(129, 154, 145, 0.15)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = divRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden rounded-xl border border-line bg-surface p-7 transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10 flex flex-col h-full gap-6">
        {children}
      </div>
    </div>
  );
}

/* ─── 4. DecryptText Component ──────────────────────────────── */

const DECRYPT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+{}|:<>?";

export function DecryptText({
  text,
  speed = 50,
  delay = 0,
  trigger = true,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  trigger?: boolean;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) {
      setDisplayText(text);
      return;
    }

    const timer = setTimeout(() => {
      let currentIteration = 0;
      
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < currentIteration) {
                return text[index];
              }
              return DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
            })
            .join("")
        );

        if (currentIteration >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        
        currentIteration += 1/3;
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, delay, trigger]);

  return <span className={className}>{displayText}</span>;
}
