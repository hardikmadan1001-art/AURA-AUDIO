"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Split a headline into individually animatable characters. */
function Chars({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span key={i} data-char className="inline-block will-change-transform">
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Exploded-part annotations — Scene 4                                 */
/* ------------------------------------------------------------------ */

const PART_LABELS = [
  { n: "01", name: "Driver Unit", desc: "11mm graphene diaphragm", pos: "left-[5%] top-[27%]" },
  { n: "02", name: "Voice Coil", desc: "OFC copper · 0.05mm tolerance", pos: "right-[6%] top-[21%] text-right" },
  { n: "03", name: "Neo Magnet", desc: "N52 neodymium core", pos: "left-[9%] top-[57%]" },
  { n: "04", name: "Diaphragm", desc: "Aerospace composite shell", pos: "right-[8%] top-[61%] text-right" },
  { n: "05", name: "ANC Microphones", desc: "Dual feed-forward array", pos: "left-[22%] top-[10%]" },
  { n: "06", name: "Bluetooth Chipset", desc: "BT 6.0 · LE Audio", pos: "right-[18%] top-[79%] text-right" },
  { n: "07", name: "Battery Cell", desc: "48h total playback", pos: "left-[5%] top-[81%]" },
  { n: "08", name: "Antenna Ring", desc: "Structural LTE-grade mesh", pos: "right-[5%] top-[41%] text-right" },
];

export default function CinematicOverlay() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      /* ---------- Opening title: one-time cinematic intro ---------- */
      const intro = el.querySelector<HTMLElement>("[data-intro]");
      if (intro) {
        gsap.from(intro.querySelectorAll("[data-char]"), {
          yPercent: 130,
          rotateX: -40,
          opacity: 0,
          duration: 1.4,
          ease: "power4.out",
          stagger: 0.045,
          delay: 0.4,
        });
        gsap.from("[data-intro-sub]", {
          opacity: 0,
          letterSpacing: "0.9em",
          duration: 2,
          ease: "power2.out",
          delay: 1.1,
        });
      }

      /* ---------- Generic scrubbed entrances per scene ---------- */
      gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((section) => {
        const targets = section.querySelectorAll<HTMLElement>("[data-reveal]");
        if (targets.length) {
          gsap.from(targets, {
            yPercent: 60,
            opacity: 0,
            stagger: 0.06,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              end: "top 25%",
              scrub: true,
            },
          });
        }
        // Every scene exhales before it leaves.
        const content = section.querySelector("[data-content]");
        if (content) {
          gsap.to(content, {
            opacity: 0,
            y: -70,
            filter: "blur(6px)",
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "bottom 92%",
              end: "bottom 55%",
              scrub: true,
            },
          });
        }
      });

      /* ---------- Giant background words: slow parallax drift ---------- */
      gsap.utils.toArray<HTMLElement>("[data-giant]").forEach((word) => {
        const dir = word.dataset.dir === "-1" ? -1 : 1;
        gsap.fromTo(
          word,
          { xPercent: -14 * dir },
          {
            xPercent: 14 * dir,
            ease: "none",
            scrollTrigger: {
              trigger: word.closest("section"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      /* ---------- SCENE 4 — the signature explosion annotations ---------- */
      const s4 = el.querySelector("#scene-explosion");
      if (s4) {
        const labels = s4.querySelectorAll("[data-part]");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: s4,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
        tl.from(labels, { autoAlpha: 0, y: 24, stagger: 0.09, ease: "none" }, 0.08)
          .from(s4.querySelector("[data-giant]"), { letterSpacing: "0.6em", autoAlpha: 0, ease: "none" }, 0)
          .to(labels, { autoAlpha: 0, y: -18, stagger: 0.03, ease: "none" }, 0.82);
      }

      /* ---------- SCENE 9 — final CTA breathes ---------- */
      gsap.to("[data-cta]", {
        scale: 1.04,
        repeat: -1,
        yoyo: true,
        duration: 1.8,
        ease: "sine.inOut",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative z-10 font-sans">
      {/* ================= SCENE 1 — SILENCE ================= */}
      <section id="scene-silence" data-scene data-name="Silence" className="relative h-[180vh]">
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <p data-intro-sub className="mb-8 text-[11px] uppercase tracking-[0.55em] text-white/40">
            Aura · Reference Series
          </p>
          <h1
            data-intro
            className="max-w-[12ch] font-display text-[clamp(3rem,10vw,9.5rem)] font-bold uppercase leading-[0.95] tracking-tighter"
          >
            <span className="block overflow-hidden pb-1"><Chars text="Sound is" /></span>
            <span className="block overflow-hidden pb-2 text-white/35"><Chars text="Invisible." /></span>
          </h1>
          <div className="mt-14 flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-white/30">
            <span className="h-px w-10 bg-white/30" />
            Scroll to listen
            <span className="h-px w-10 bg-white/30" />
          </div>
        </div>
      </section>

      {/* ================= SCENE 2 — FIRST CONTACT ================= */}
      <section id="scene-contact" data-scene data-name="First Contact" className="relative h-[160vh]">
        <div data-content className="sticky top-0 flex h-screen items-end p-8 md:p-20">
          <div className="max-w-3xl">
            <h2 data-reveal className="overflow-hidden font-display text-[clamp(2.6rem,7vw,7rem)] font-bold uppercase leading-none tracking-tighter">
              First<br />Contact.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/50 md:text-lg">
              No interface. No noise. Only the object — machined from a single
              intention. Meet Aura One.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SCENE 3 — ENGINEERING REVEAL ================= */}
      <section id="scene-reveal" data-scene data-name="Engineering" className="relative h-[220vh]">
        <div
          data-giant
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-transparent opacity-[0.07]"
          style={{ WebkitTextStroke: "1px #ffffff" }}
        >
          Precision
        </div>
        <div data-content className="sticky top-0 flex h-screen items-center justify-end p-8 md:p-20">
          <div className="max-w-xl space-y-12 text-right">
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Machined,<br />
              <span className="text-white/40">not made.</span>
            </h2>
            {[
              ["01", "Single-crystal aluminium", "CNC-milled for 41 minutes per shell."],
              ["02", "Diamond-like coating", "3 microns of scratch-proof silence."],
              ["03", "0.01g symmetry", "Balanced to a grain of sand."],
            ].map(([n, t, d]) => (
              <div key={n} data-reveal className="flex items-baseline justify-end gap-5 border-r border-white/15 pr-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-widest">{t}</p>
                  <p className="mt-1 text-sm font-light text-white/40">{d}</p>
                </div>
                <span className="font-mono text-xs text-white/30">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SCENE 4 — THE SIGNATURE EXPLOSION ================= */}
      <section id="scene-explosion" data-scene data-name="Deconstruction" className="relative h-[320vh]">
        <div
          data-giant
          data-dir="-1"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[16%] whitespace-nowrap text-center font-display text-[13vw] font-black uppercase leading-none tracking-tight text-white/[0.05]"
        >
          Deconstructed
        </div>
        <div data-content className="sticky top-0 h-screen">
          <p data-reveal className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.5em] text-white/35">
            Every layer. Engineered.
          </p>
          {PART_LABELS.map((l) => (
            <div key={l.n} data-part className={`absolute ${l.pos} max-w-[220px]`}>
              <div className={`mb-3 h-px w-12 bg-gradient-to-r ${l.pos.includes("text-right") ? "ml-auto bg-gradient-to-l" : ""} from-white/60 to-transparent`} />
              <p className="font-mono text-[10px] text-white/35">{l.n}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-widest">{l.name}</p>
              <p className="mt-1 text-xs font-light text-white/40">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SCENE 5 — INSIDE THE SOUND ================= */}
      <section id="scene-inside" data-scene data-name="Inside The Sound" className="relative h-[200vh]">
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <h2 data-reveal className="font-display text-[clamp(2.4rem,7vw,6.5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Sound,<br /><span className="text-white/40">made physical.</span>
          </h2>
          <p data-reveal className="mt-8 max-w-md text-sm font-light leading-relaxed text-white/45 md:text-base">
            You are inside the acoustic chamber. Twenty-micron waves roll past
            you — this is what 20Hz feels like.
          </p>
        </div>
      </section>

      {/* ================= SCENE 6 — ANC ================= */}
      <section id="scene-anc" data-scene data-name="Noise Cancellation" className="relative h-[200vh]">
        <div data-content className="sticky top-0 flex h-screen items-center justify-start p-8 md:p-20">
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#ff6a4d]/80">
              −48 dB · Real time
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold uppercase leading-none tracking-tighter">
              Silence<br />the world.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/50">
              Eight hundred samples per second, inverted and erased. Watch the
              red chaos dissolve against the microphone array.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SCENE 7 — POWER ================= */}
      <section id="scene-power" data-scene data-name="Power System" className="relative h-[160vh]">
        <div data-content className="sticky top-0 flex h-screen items-end justify-end p-8 md:p-20">
          <div className="max-w-lg text-right">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#ffb45e]/90">
              Energy architecture
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold uppercase leading-none tracking-tighter">
              48 hours.<br />
              <span className="text-white/40">Zero anxiety.</span>
            </h2>
            <p data-reveal className="mt-8 text-base font-light leading-relaxed text-white/50">
              Follow the current: a steel-case cell feeding a 3nm amplifier
              through pathways thinner than a human hair.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SCENE 8 — REASSEMBLY ================= */}
      <section id="scene-reassembly" data-scene data-name="Reassembly" className="relative h-[180vh]">
        <div data-content className="sticky top-0 flex h-screen items-center justify-center px-6 text-center">
          <h2 data-reveal className="font-display text-[clamp(1.6rem,4vw,3.4rem)] font-light uppercase tracking-[0.35em] text-white/70">
            Perfectly in tune.
          </h2>
        </div>
      </section>

      {/* ================= SCENE 9 — FINAL HERO ================= */}
      <section id="scene-final" data-scene data-name="Hear Everything" className="relative h-[150vh]">
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <h2 className="font-display text-[clamp(3.4rem,12vw,11rem)] font-bold uppercase leading-[0.95] tracking-tighter">
            <span data-reveal className="block">Hear</span>
            <span data-reveal className="block text-white/40">Everything.</span>
          </h2>
          <button
            data-cta
            data-hover
            className="mt-14 rounded-full bg-white px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] text-black transition-colors duration-300 hover:bg-[#57e6ff]"
          >
            Pre-Order — $349
          </button>
          <div className="absolute bottom-8 flex w-full items-center justify-between px-8 text-[10px] uppercase tracking-[0.3em] text-white/25 md:px-20">
            <span>Aura Audio © 2026</span>
            <span>Designed in silence</span>
          </div>
        </div>
      </section>
    </div>
  );
}
