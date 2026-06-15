"use client";

import { useEffect, useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";
import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { UserButton, useAuth } from "@clerk/nextjs";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "AI Workflows", href: "/#playground" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "FAQ", href: "/#faq" },
];

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <div
        className="pointer-events-auto mt-3 w-full max-w-shell rounded-xl border transition-all duration-300"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: scrolled ? "var(--border-strong)" : "var(--border)",
          boxShadow: scrolled ? "0 12px 40px -20px rgba(17,24,39,0.3)" : "none",
          transform: scrolled ? "scale(0.985)" : "scale(1)",
        }}
      >
        <nav
          className="flex items-center justify-between px-4 transition-all duration-300"
          style={{ height: scrolled ? 56 : 68 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.png" alt="MailyFlow Logo" className="h-7 w-7 object-contain shrink-0" />
            <span className="font-display text-[17px] font-semibold tracking-tight text-text">MailyFlow</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-text"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop Right items */}
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {isLoaded && (
              <>
                {!isSignedIn && (
                  <>
                    <Link href="/sign-in">
                      <Button variant="ghost" className="px-4">Sign In</Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button variant="primary" glow magnetic className="px-4">Get Started</Button>
                    </Link>
                  </>
                )}
                {isSignedIn && (
                  <>
                    <Link href="/dashboard">
                      <Button variant="secondary" className="px-4">Dashboard</Button>
                    </Link>
                    <div className="flex h-9 w-9 items-center justify-center">
                      <UserButton />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-text"
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface2 hover:text-text"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2">
                {isLoaded && (
                  <>
                    {!isSignedIn && (
                      <div className="flex gap-2">
                        <Link href="/sign-in" className="flex-1" onClick={() => setOpen(false)}>
                          <Button variant="secondary" className="w-full">Sign In</Button>
                        </Link>
                        <Link href="/sign-up" className="flex-1" onClick={() => setOpen(false)}>
                          <Button variant="primary" className="w-full">Get Started</Button>
                        </Link>
                      </div>
                    )}
                    {isSignedIn && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-surface2 border border-line">
                        <Link href="/dashboard" className="flex-1 mr-4" onClick={() => setOpen(false)}>
                          <Button variant="secondary" className="w-full">Go to Dashboard</Button>
                        </Link>
                        <div className="flex h-9 w-9 items-center justify-center pr-1">
                          <UserButton />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
