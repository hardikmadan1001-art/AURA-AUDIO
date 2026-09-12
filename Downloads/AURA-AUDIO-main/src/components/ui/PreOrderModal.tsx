"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, ArrowRight, Check, Mail } from "lucide-react";
import gsap from "gsap";

/**
 * PreOrderModal — transparent pre-order information with two tiers:
 * 1. $50 fully refundable deposit → guaranteed serial from first 1,000
 * 2. Engineering Waitlist → email-only, zero commitment
 *
 * Triggered by the sticky pre-order bar or the hero CTA.
 */

export default function PreOrderModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTier, setActiveTier] = useState<"deposit" | "waitlist">("deposit");
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("aura:open-preorder", handler);
    return () => window.removeEventListener("aura:open-preorder", handler);
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Animate in
  useEffect(() => {
    if (open && overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(panelRef.current, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.1 });
    }
  }, [open]);

  const close = useCallback(() => {
    if (overlayRef.current && panelRef.current) {
      gsap.to(panelRef.current, { opacity: 0, y: 20, duration: 0.25, ease: "power2.in" });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => setOpen(false) });
    } else {
      setOpen(false);
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitted(true);
  }, [email]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) close(); }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0c]/95 p-8 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        {/* Close button */}
        <button
          onClick={close}
          data-hover
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white/80"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#57e6ff]/70 mb-2">
            Spring 2027
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Reserve Your Serial
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            The first batch of 1,000 AURA One units includes individually numbered,
            laser-engraved serial plates. Secure your position with a fully refundable deposit.
          </p>
        </div>

        {/* Tier selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTier("deposit")}
            className={`flex-1 rounded-lg border px-4 py-3 text-left transition-all ${
              activeTier === "deposit"
                ? "border-[#57e6ff]/30 bg-[#57e6ff]/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">
              $50 Deposit
            </p>
            <p className="mt-1 text-[10px] text-white/45">
              Fully refundable · Serial allocation
            </p>
          </button>
          <button
            onClick={() => setActiveTier("waitlist")}
            className={`flex-1 rounded-lg border px-4 py-3 text-left transition-all ${
              activeTier === "waitlist"
                ? "border-[#57e6ff]/30 bg-[#57e6ff]/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">
              Waitlist
            </p>
            <p className="mt-1 text-[10px] text-white/45">
              Email only · Zero commitment
            </p>
          </button>
        </div>

        {/* Content */}
        {activeTier === "deposit" ? (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {[
                "Guaranteed serial #001–#1,000 from first batch",
                "Full $50 refundable at any time before shipping",
                "Priority firmware beta access",
                "Exclusive founding member digital certificate",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#57e6ff]" />
                  <span className="text-xs leading-relaxed text-white/65">{item}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/8 my-4" />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#57e6ff]/40 focus:outline-none focus:ring-1 focus:ring-[#57e6ff]/20"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-[#57e6ff]/15 border border-[#57e6ff]/30 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#57e6ff] transition-all hover:bg-[#57e6ff]/25 hover:shadow-[0_0_20px_rgba(87,230,255,0.15)]"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-[#57e6ff]/20 bg-[#57e6ff]/5 p-4 text-center">
                <p className="text-sm text-[#57e6ff]">Serial reserved. Check your inbox.</p>
              </div>
            )}

            <p className="text-[10px] text-white/30">
              No payment is charged today. You will only be charged when units begin shipping in Spring 2027.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-white/55">
              Join the engineering development list for firmware updates, driver tuning insights,
              and behind-the-scenes build logs — no financial commitment required.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex items-center gap-2 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 transition-all hover:border-white/30 hover:text-white/90"
                >
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-[#57e6ff]/20 bg-[#57e6ff]/5 p-4 text-center">
                <p className="text-sm text-[#57e6ff]">Welcome to the waitlist. We&apos;ll be in touch.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
