"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES, ACTS, sceneVh } from "@/lib/story";

/* ------------------------------------------------------------------ */
/* Reusable density components — every scene gets layers               */
/* ------------------------------------------------------------------ */

/** Cyan radial halo behind hero headlines. */
function Halo({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`aura-halo ${className}`} />;
}

/** Small caption that links a number to its meaning. */
function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
      {children}
    </p>
  );
}

/* Split a headline into individually animatable characters with
 * perspective depth and stagger timing. */
function Chars({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span
          key={i}
          data-char
          className={`inline-block will-change-transform ${className}`}
          style={{ transformOrigin: "center bottom" }}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </>
  );
}

/** Massive background word with slow parallax drift + blur fade. */
function GiantWord({
  text,
  className = "",
  stroke = "#ffffff",
  opacity = 0.05,
}: {
  text: string;
  className?: string;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <div
      data-giant
      aria-hidden
      className={`pointer-events-none absolute whitespace-nowrap font-display font-black uppercase leading-none tracking-tighter ${className}`}
      style={{
        WebkitTextStroke: `1px ${stroke}`,
        color: "transparent",
        opacity,
        filter: `blur(${Math.max(0, opacity * 8)}px)`,
      }}
    >
      {text}
    </div>
  );
}

/** Subtle blueprint grid backdrop. */
function GridBackdrop({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="bg-grid pointer-events-none absolute inset-0"
      style={{ opacity }}
    />
  );
}

/** Floating technical label — coordinates, status readouts, telemetry. */
function TechLabel({
  n,
  children,
  className = "",
}: {
  n: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-reveal
      className={`pointer-events-none absolute hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 md:flex ${className}`}
    >
      <span className="inline-block h-1 w-1 rotate-45 bg-[#57e6ff]/70" />
      <span className="text-[#57e6ff]/60">{n}</span>
      {children}
    </div>
  );
}

/** Corner frame ticks — a viewfinder around the whole screen. */
function CornerFrame() {
  const base = "pointer-events-none absolute h-5 w-5 border-white/15";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-6 md:inset-10">
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

/** Watermark roman numeral for the current act. */
function ActMark({ act }: { act: number }) {
  const a = ACTS[act - 1];
  return (
    <div
      aria-hidden
      data-giant
      className="pointer-events-none absolute bottom-[8%] right-[4%] select-none font-display text-[18vw] font-black leading-none tracking-tighter text-white/[0.04]"
    >
      {a.n}
    </div>
  );
}

/** Animated count-up number, fired once on entry. */
function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: value,
      duration: 2.2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => {
        el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, decimals, prefix, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}0{suffix}
    </span>
  );
}

/** Sound-reactive equalizer bars (time-animated, velocity is in the 3D). */
function EqBars({ count = 28, height = "h-32" }: { count?: number; height?: string }) {
  return (
    <div data-reveal className={`flex ${height} items-end gap-[6px] md:gap-2`}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          data-bar
          className="w-1 origin-bottom rounded-full bg-gradient-to-t from-white/5 via-white/30 to-[#57e6ff]/80 md:w-1.5"
          style={{ height: "100%", transform: "scaleY(0.08)" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline SVG instruments — scene-specific visuals                     */
/* ------------------------------------------------------------------ */

/** Human hearing curve + four spec markers. Used in the Frequencies scene. */
function SpectrumCurve() {
  return (
    <svg
      viewBox="0 0 800 200"
      className="h-32 w-full"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id="specGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#57e6ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#57e6ff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Equal-loudness contour */}
      <path
        d="M0,160 C40,90 90,40 180,20 C280,8 380,28 480,80 C560,120 660,150 800,170"
        fill="none"
        stroke="url(#specGrad)"
        strokeWidth="1.4"
      />
      {/* Spec markers */}
      <g fontFamily="ui-monospace, monospace" fontSize="9" fill="rgba(255,255,255,0.45)">
        <line x1="40" y1="148" x2="40" y2="172" stroke="rgba(255,255,255,0.25)" />
        <text x="48" y="190">20 Hz</text>
        <line x1="280" y1="22" x2="280" y2="172" stroke="rgba(255,255,255,0.25)" />
        <text x="240" y="14">11 mm</text>
        <line x1="500" y1="76" x2="500" y2="172" stroke="rgba(255,255,255,0.25)" />
        <text x="478" y="190" fill="#57e6ff" fillOpacity="0.8">−48 dB</text>
        <line x1="720" y1="158" x2="720" y2="172" stroke="rgba(255,255,255,0.25)" />
        <text x="690" y="190">20 kHz</text>
      </g>
    </svg>
  );
}

/** Horizontal battery that fills cyan. Used in Cell scene. */
function BatteryFill() {
  return (
    <svg viewBox="0 0 600 80" className="h-20 w-full" aria-hidden>
      <rect
        x="0.5"
        y="14"
        width="599"
        height="52"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <rect x="600" y="26" width="6" height="28" fill="rgba(255,255,255,0.25)" />
      <g className="origin-left">
        <rect
          x="6"
          y="20"
          width="290"
          height="40"
          fill="url(#battGrad)"
          data-batt
        />
      </g>
      <defs>
        <linearGradient id="battGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#57e6ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <g
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fill="rgba(255,255,255,0.55)"
        letterSpacing="0.25em"
      >
        <text x="14" y="46">8 H</text>
        <text x="172" y="46">24 H</text>
        <text x="330" y="46" fill="#57e6ff">48 H</text>
        <text x="486" y="46">CASE</text>
      </g>
    </svg>
  );
}

/** Two waveforms cancelling each other out. Used in ANC scene. */
function AncInterference() {
  return (
    <svg viewBox="0 0 600 160" className="h-40 w-full" aria-hidden>
      {/* Red noise wave */}
      <path
        d="M0,80 Q15,30 30,80 T60,80 T90,80 T120,80 T150,80 T180,80 T210,80 T240,80 T270,80 T300,80 T330,80 T360,80 T390,80 T420,80 T450,80 T480,80 T510,80 T540,80 T570,80 T600,80"
        fill="none"
        stroke="#ff6a4d"
        strokeWidth="1.3"
        opacity="0.65"
        data-noisewave
      />
      {/* Cyan anti-noise wave (inverted) */}
      <path
        d="M0,80 Q15,130 30,80 T60,80 T90,80 T120,80 T150,80 T180,80 T210,80 T240,80 T270,80 T300,80 T330,80 T360,80 T390,80 T420,80 T450,80 T480,80 T510,80 T540,80 T570,80 T600,80"
        fill="none"
        stroke="#57e6ff"
        strokeWidth="1.3"
        opacity="0.65"
        data-antiwave
      />
      {/* Resulting flat line */}
      <line
        x1="0"
        y1="80"
        x2="600"
        y2="80"
        stroke="white"
        strokeWidth="1"
        opacity="0.4"
        data-silence
      />
      <g
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,255,255,0.5)"
      >
        <text x="6" y="20" fill="#ff6a4d" fillOpacity="0.9">NOISE</text>
        <text x="540" y="20" fill="#57e6ff" fillOpacity="0.9">ANTI</text>
        <text x="280" y="150" textAnchor="middle" fill="white" fillOpacity="0.7">SILENCE</text>
      </g>
    </svg>
  );
}

/** L / R points separating horizontally. Used in Separation scene. */
function StereoField() {
  return (
    <svg viewBox="0 0 600 80" className="h-16 w-full" aria-hidden>
      <line
        x1="0"
        y1="40"
        x2="600"
        y2="40"
        stroke="rgba(255,255,255,0.15)"
        strokeDasharray="2 4"
      />
      <circle cx="300" cy="40" r="3" fill="white" opacity="0.5" />
      <text
        x="300"
        y="20"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,255,255,0.5)"
      >
        0
      </text>
      <g data-stereo>
        <circle cx="220" cy="40" r="6" fill="#57e6ff" />
        <text
          x="220"
          y="64"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.3em"
          fill="#57e6ff"
        >
          L
        </text>
        <circle cx="380" cy="40" r="6" fill="#57e6ff" />
        <text
          x="380"
          y="64"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.3em"
          fill="#57e6ff"
        >
          R
        </text>
      </g>
    </svg>
  );
}

/** Driver cross-section (circular diaphragm + suspension). */
function DriverCrossSection() {
  return (
    <svg viewBox="0 0 400 400" className="h-72 w-auto" aria-hidden>
      <defs>
        <radialGradient id="coneGrad" cx="0.5" cy="0.4" r="0.5">
          <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.4" />
          <stop offset="80%" stopColor="#57e6ff" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle
        cx="200"
        cy="200"
        r="180"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <circle
        cx="200"
        cy="200"
        r="140"
        fill="url(#coneGrad)"
        stroke="#57e6ff"
        strokeOpacity="0.6"
        strokeWidth="1"
      />
      <circle
        cx="200"
        cy="200"
        r="48"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.2"
      />
      <circle cx="200" cy="200" r="10" fill="white" />
      {/* Annotation lines */}
      <g
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.8"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fill="rgba(255,255,255,0.55)"
        letterSpacing="0.25em"
      >
        <line x1="200" y1="20" x2="200" y2="60" />
        <text x="210" y="46">3 µm DIAPHRAGM</text>
        <line x1="200" y1="340" x2="200" y2="380" />
        <text x="148" y="372">GOLD SUSPENSION</text>
        <line x1="20" y1="200" x2="60" y2="200" />
        <text x="22" y="194" textAnchor="end">
          COIL
        </text>
      </g>
    </svg>
  );
}

/** Glowing dot riding a path from cell → amplifier → driver. Power scene. */
function CurrentPath() {
  return (
    <svg viewBox="0 0 600 120" className="h-28 w-full" aria-hidden>
      <defs>
        <linearGradient id="currentGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ffb45e" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffb45e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffb45e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="60"
        y1="60"
        x2="240"
        y2="60"
        stroke="rgba(255,180,90,0.25)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <line
        x1="360"
        y1="60"
        x2="540"
        y2="60"
        stroke="rgba(255,180,90,0.25)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <rect x="40" y="40" width="40" height="40" fill="none" stroke="#ffb45e" strokeWidth="1" />
      <text
        x="60"
        y="100"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,180,90,0.8)"
      >
        CELL
      </text>
      <rect x="240" y="40" width="120" height="40" fill="none" stroke="#ffb45e" strokeWidth="1" />
      <text
        x="300"
        y="100"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,180,90,0.8)"
      >
        3 NM AMP
      </text>
      <circle
        cx="560"
        cy="60"
        r="14"
        fill="none"
        stroke="#ffb45e"
        strokeWidth="1"
      />
      <circle cx="560" cy="60" r="4" fill="#ffb45e" />
      <text
        x="560"
        y="100"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,180,90,0.8)"
      >
        DRIVER
      </text>
      <circle r="3" fill="#fff" data-current>
        <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
          <mpath href="#powerPath" />
        </animateMotion>
      </circle>
      <path
        id="powerPath"
        d="M 60,60 L 240,60 L 360,60 L 540,60"
        fill="none"
        stroke="none"
      />
    </svg>
  );
}

/** Concentric radiating rings around a transmitter. Connectivity scene. */
function SignalRings({ count = 4 }: { count?: number }) {
  return (
    <svg viewBox="0 0 200 200" className="h-32 w-32" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={20 + i * 18}
          fill="none"
          stroke="#57e6ff"
          strokeWidth="0.8"
          opacity={0.5 - i * 0.1}
        >
          <animate
            attributeName="r"
            values={`${20 + i * 18};${30 + i * 18};${20 + i * 18}`}
            dur="2.2s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={`${0.5 - i * 0.1};0.05;${0.5 - i * 0.1}`}
            dur="2.2s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      <circle cx="100" cy="100" r="6" fill="#57e6ff" />
    </svg>
  );
}

/** 360° indicator: head at center, four instruments around the perimeter. */
function SpatialField() {
  return (
    <svg viewBox="0 0 300 300" className="h-56 w-56" aria-hidden>
      <circle
        cx="150"
        cy="150"
        r="120"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeDasharray="2 4"
      />
      <circle cx="150" cy="150" r="40" fill="none" stroke="rgba(255,255,255,0.4)" />
      <circle cx="150" cy="150" r="6" fill="white" />
      <text
        x="150"
        y="155"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,255,255,0.7)"
      >
        YOU
      </text>
      {/* Instruments pinned in space */}
      <g>
        <circle cx="150" cy="30" r="6" fill="#b48cff" />
        <text x="150" y="20" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#b48cff" letterSpacing="0.3em">VOCALS</text>
      </g>
      <g>
        <circle cx="270" cy="150" r="6" fill="#b48cff" />
        <text x="282" y="154" fontFamily="ui-monospace, monospace" fontSize="9" fill="#b48cff" letterSpacing="0.3em">DRUMS</text>
      </g>
      <g>
        <circle cx="150" cy="270" r="6" fill="#b48cff" />
        <text x="150" y="285" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#b48cff" letterSpacing="0.3em">BASS</text>
      </g>
      <g>
        <circle cx="30" cy="150" r="6" fill="#b48cff" />
        <text x="18" y="154" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill="#b48cff" letterSpacing="0.3em">STRINGS</text>
      </g>
    </svg>
  );
}

/** Four material swatches used in the Touch scene. */
function MaterialSwatches() {
  const items = [
    { name: "Ceramic-gloss", id: "A" },
    { name: "Medical silicone", id: "B" },
    { name: "Sapphire mesh", id: "C" },
    { name: "Recycled aluminium", id: "D" },
  ];
  return (
    <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((m) => (
        <div key={m.id} data-reveal className="space-y-2">
          <div
            className="aspect-square w-full border border-white/10 bg-gradient-to-br"
            style={{
              backgroundImage:
                m.id === "A"
                  ? "linear-gradient(135deg,#1a1a1a,#3a3a3a)"
                  : m.id === "B"
                  ? "linear-gradient(135deg,#2a2a30,#4a4a55)"
                  : m.id === "C"
                  ? "linear-gradient(135deg,#9bb1c4,#e6f2ff)"
                  : "linear-gradient(135deg,#7a8186,#b8bdc1)",
            }}
          />
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/45">
            {m.id} · {m.name}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Horizontal proportional bar comparison. Versus scene. */
function ComparisonBar({
  label,
  oursPct,
  theirsPct,
  ours,
  theirs,
  highlight,
}: {
  label: string;
  oursPct: number;
  theirsPct: number;
  ours: string;
  theirs: string;
  highlight?: boolean;
}) {
  return (
    <div data-reveal className="border-b border-white/10 py-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/55">
          {label}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-12 text-[10px] uppercase tracking-[0.3em] text-[#57e6ff]/80">
            ours
          </span>
          <div className="relative h-2 flex-1 bg-white/5">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#57e6ff]/40 to-[#57e6ff]"
              style={{ width: `${oursPct}%` }}
            />
          </div>
          <span className="w-20 text-right font-mono text-xs text-[#57e6ff]">
            {ours}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-12 text-[10px] uppercase tracking-[0.3em] text-white/30">
            theirs
          </span>
          <div className="relative h-2 flex-1 bg-white/5">
            <div
              className="absolute inset-y-0 left-0 bg-white/25"
              style={{ width: `${theirsPct}%` }}
            />
          </div>
          <span className="w-20 text-right font-mono text-xs text-white/35">
            {theirs}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Prototype timeline for the Manifesto scene. */
function PrototypeTimeline() {
  const steps = [
    { y: "2019", t: "Patent filed" },
    { y: "2021", t: "First graphene" },
    { y: "2023", t: "1100 prototypes" },
    { y: "2026", t: "Aura One" },
  ];
  return (
    <div data-reveal className="max-w-xl">
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        Four-year arc
      </p>
      <div className="relative flex items-center justify-between">
        <span className="absolute left-0 right-0 h-px bg-white/15" />
        {steps.map((s, i) => (
          <div key={s.y} className="relative flex flex-col items-center gap-2 bg-black/40 px-2">
            <span className="h-2 w-2 rotate-45 border border-[#57e6ff]/80" />
            <span className="font-mono text-[10px] tracking-widest text-white/70">
              {s.y}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              {s.t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Light sweep that travels during the Material scene. */
function MaterialSweep() {
  return (
    <div
      aria-hidden
      data-sweep
      className="pointer-events-none fixed inset-y-0 left-0 z-30 w-32 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
    />
  );
}

/** Light leak during the Glimpse scene. */
function SeamLightLeak() {
  return (
    <div
      aria-hidden
      data-leak
      className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(87,230,255,0.55), transparent)",
        boxShadow:
          "0 0 80px rgba(87,230,255,0.5), 0 0 220px rgba(87,230,255,0.2)",
      }}
    />
  );
}

/** Ascending particles during the Rise scene. */
function RisingParticles() {
  const particles = Array.from({ length: 8 }).map((_, i) => ({
    left: `${10 + i * 9}%`,
    delay: i * 0.4,
    duration: 3 + (i % 3),
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-5 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 h-8 w-px"
          style={{
            left: p.left,
            background:
              "linear-gradient(to top, transparent, rgba(87,230,255,0.6), transparent)",
            animation: `riseDot ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes riseDot {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-90vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/** Convergence particles for Reassembly scene. */
function ConvergingParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 28 + (i % 4) * 4;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[#57e6ff]/80"
            style={{
              animation: `converge 2.4s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
              "--ox": `${Math.cos(angle) * radius}vmin`,
              "--oy": `${Math.sin(angle) * radius}vmin`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes converge {
          0%, 100% { transform: translate(0, 0) scale(0.4); opacity: 0; }
          50% { transform: translate(var(--ox), var(--oy)) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** Materializing fog layer during the Approach scene. */
function VolumetricHaze() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
      style={{
        background:
          "linear-gradient(to top, rgba(20,30,40,0.45), transparent 70%)",
        maskImage:
          "radial-gradient(ellipse 80% 60% at 50% 100%, black, transparent 80%)",
      }}
    />
  );
}

/** Faint blueprint of the earbud that rotates during Engineering intro. */
function EarbudBlueprint() {
  return (
    <svg
      viewBox="0 0 200 240"
      className="h-72 w-auto opacity-25"
      style={{ animation: "blueprintSpin 30s linear infinite" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="bpGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#57e6ff" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="80" rx="70" ry="80" fill="none" stroke="url(#bpGrad)" strokeWidth="0.7" />
      <ellipse cx="100" cy="80" rx="40" ry="50" fill="none" stroke="url(#bpGrad)" strokeWidth="0.5" />
      <line x1="100" y1="160" x2="100" y2="220" stroke="url(#bpGrad)" strokeWidth="0.7" />
      <ellipse cx="100" cy="80" rx="58" ry="70" fill="none" stroke="url(#bpGrad)" strokeWidth="0.4" strokeDasharray="2 3" />
      <line x1="30" y1="80" x2="170" y2="80" stroke="url(#bpGrad)" strokeWidth="0.3" strokeDasharray="2 3" />
      <line x1="100" y1="0" x2="100" y2="160" stroke="url(#bpGrad)" strokeWidth="0.3" strokeDasharray="2 3" />
      <style>{`
        @keyframes blueprintSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

/** Shell layer cross-section. */
function ShellLayers() {
  return (
    <svg viewBox="0 0 400 100" className="h-24 w-full" aria-hidden>
      <g fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="0.3em" fill="rgba(255,255,255,0.6)">
        {/* Three layers */}
        <rect x="20" y="20" width="360" height="18" fill="#1a1a1a" stroke="rgba(255,255,255,0.3)" />
        <text x="30" y="33">01 · CERAMIC GLOSS</text>
        <rect x="20" y="40" width="360" height="22" fill="#202428" stroke="rgba(255,255,255,0.3)" />
        <text x="30" y="55">02 · DAMPING COMPOSITE</text>
        <rect x="20" y="64" width="360" height="18" fill="#0e1014" stroke="rgba(255,255,255,0.3)" />
        <text x="30" y="77">03 · SEAL FOAM</text>
        <line x1="20" y1="50" x2="380" y2="50" stroke="#57e6ff" strokeWidth="0.5" strokeDasharray="2 3" />
      </g>
    </svg>
  );
}

/** Processor die illustration. */
function ProcessorDie() {
  return (
    <svg viewBox="0 0 200 200" className="h-48 w-48" aria-hidden>
      <rect x="20" y="20" width="160" height="160" fill="#0a0e14" stroke="#57e6ff" strokeOpacity="0.4" />
      <rect x="60" y="60" width="80" height="80" fill="none" stroke="rgba(87,230,255,0.6)" />
      <line x1="60" y1="100" x2="140" y2="100" stroke="rgba(87,230,255,0.4)" />
      <line x1="100" y1="60" x2="100" y2="140" stroke="rgba(87,230,255,0.4)" />
      <g fontFamily="ui-monospace, monospace" fontSize="7" letterSpacing="0.2em" fill="rgba(255,255,255,0.65)">
        <text x="62" y="74">EQ</text>
        <text x="118" y="74">ANC</text>
        <text x="62" y="118">BT</text>
        <text x="118" y="118">HUB</text>
      </g>
      <g fontFamily="ui-monospace, monospace" fontSize="6" letterSpacing="0.3em" fill="rgba(255,255,255,0.5)">
        <text x="20" y="14">3 nm</text>
        <text x="150" y="14" textAnchor="end">AURA</text>
      </g>
      <text
        x="100"
        y="194"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(87,230,255,0.8)"
      >
        AURA SILICON
      </text>
    </svg>
  );
}

/** Compass / orbit dial that rotates during the Orbit scene. */
function CompassDial() {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(255,255,255,0.2)" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="2 3" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 60 + Math.cos(a) * 50;
        const y1 = 60 + Math.sin(a) * 50;
        const x2 = 60 + Math.cos(a) * 56;
        const y2 = 60 + Math.sin(a) * 56;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.7"
          />
        );
      })}
      <g
        style={{ transformOrigin: "60px 60px", animation: "compassSpin 5s linear infinite" }}
      >
        <polygon points="60,16 64,60 60,52 56,60" fill="#57e6ff" />
      </g>
      <circle cx="60" cy="60" r="3" fill="white" />
      <text
        x="60"
        y="110"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="0.3em"
        fill="rgba(255,255,255,0.65)"
      >
        14°/S
      </text>
      <style>{`
        @keyframes compassSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

/** Real waveform that draws itself. Waves scene. */
function WaveformScrub() {
  return (
    <svg viewBox="0 0 800 120" className="h-24 w-full" aria-hidden>
      <line
        x1="0"
        y1="60"
        x2="800"
        y2="60"
        stroke="rgba(255,255,255,0.1)"
      />
      <path
        d="M0,60 Q40,20 80,60 T160,60 T240,60 T320,60 T400,60 T480,60 T560,60 T640,60 T720,60 T800,60"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="1.5"
      >
        <animate
          attributeName="d"
          dur="3s"
          repeatCount="indefinite"
          values="
            M0,60 Q40,20 80,60 T160,60 T240,60 T320,60 T400,60 T480,60 T560,60 T640,60 T720,60 T800,60;
            M0,60 Q40,100 80,60 T160,60 T240,60 T320,60 T400,60 T480,60 T560,60 T640,60 T720,60 T800,60;
            M0,60 Q40,20 80,60 T160,60 T240,60 T320,60 T400,60 T480,60 T560,60 T640,60 T720,60 T800,60
          "
        />
      </path>
      <circle cx="20" cy="60" r="4" fill="#57e6ff">
        <animate attributeName="cx" values="0;800;0" dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" dur="6s" repeatCount="indefinite" />
      </circle>
      <defs>
        <linearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#57e6ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#57e6ff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Counts down instead of up — CNC timer for the Craft scene. */
function Countdown({ fromSeconds = 41 * 60 }: { fromSeconds?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { s: fromSeconds };
    const tween = gsap.to(obj, {
      s: 0,
      duration: 14,
      ease: "power1.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onUpdate: () => {
        const m = Math.floor(obj.s / 60);
        const s = Math.floor(obj.s % 60);
        el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [fromSeconds]);
  return (
    <span ref={ref} className="tabular-nums">
      41:00
    </span>
  );
}

/** Small spec chip row item. */
function SpecChip({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div data-reveal className="border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">{k}</p>
      <p className="mt-1 font-display text-sm font-bold uppercase tracking-wide">{v}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene section wrapper                                               */
/* ------------------------------------------------------------------ */

function Scene({
  id,
  act,
  children,
  className = "",
}: {
  id: string;
  act: number;
  children: React.ReactNode;
  className?: string;
}) {
  const def = SCENES.find((s) => s.id === id)!;
  return (
    <section
      id={`scene-${id}`}
      data-scene
      data-name={def.name}
      data-act={act}
      style={{ height: `${sceneVh(id)}vh` }}
      className={`relative ${className}`}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exploded-part annotations — ACT V                                   */
/* ------------------------------------------------------------------ */

const PART_LABELS = [
  { n: "01", name: "Outer Shell", desc: "Ceramic-gloss composite", pos: "left-[5%] top-[24%]" },
  { n: "02", name: "Graphene Driver", desc: "11 mm diaphragm · 3 µm", pos: "right-[6%] top-[19%] text-right" },
  { n: "03", name: "Acoustic Chamber", desc: "Rear volume · bass tuned", pos: "left-[8%] top-[55%]" },
  { n: "04", name: "Battery Cell", desc: "Steel-jacketed li-ion", pos: "right-[7%] top-[59%] text-right" },
  { n: "05", name: "ANC Array", desc: "Six-microphone hybrid", pos: "left-[21%] top-[9%]" },
  { n: "06", name: "Aura Silicon", desc: "3 nm processor", pos: "right-[17%] top-[78%] text-right" },
  { n: "07", name: "Charging Contacts", desc: "Gold-plated · four-pin", pos: "left-[4%] top-[80%]" },
  { n: "08", name: "Antenna Ring", desc: "Structural mesh", pos: "right-[4%] top-[38%] text-right" },
];

/* ------------------------------------------------------------------ */
/* The screenplay                                                      */
/* ------------------------------------------------------------------ */

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

      /* ---------- Sound-reactive equalizer bars ---------- */
      el.querySelectorAll("[data-bar]").forEach((bar, i) => {
        gsap.to(bar, {
          scaleY: () => 0.15 + Math.random() * 0.85,
          duration: 0.35 + Math.random() * 0.55,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.04,
        });
      });

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
        const dir = (word as HTMLElement).dataset.dir === "-1" ? -1 : 1;
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

      /* ---------- ACT V — the signature explosion annotations ---------- */
      const sExplode = el.querySelector("#scene-explosion");
      if (sExplode) {
        const labels = sExplode.querySelectorAll("[data-part]");
        const conns = sExplode.querySelectorAll<SVGLineElement>("[data-conn-line]");
        // Animate the connection lines by toggling stroke-dashoffset (no plugin needed).
        conns.forEach((line) => {
          const len = line.getTotalLength?.() ?? 0;
          if (len) {
            line.style.strokeDasharray = `${len}`;
            line.style.strokeDashoffset = `${len}`;
          }
        });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sExplode,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
        tl.to(conns, { strokeDashoffset: 0, ease: "none", stagger: 0.04 }, 0.05)
          .from(labels, { autoAlpha: 0, y: 24, stagger: 0.09, ease: "none" }, 0.08)
          .from(sExplode.querySelector("[data-giant]"), { letterSpacing: "0.6em", autoAlpha: 0, ease: "none" }, 0)
          .to(labels, { autoAlpha: 0, y: -18, stagger: 0.03, ease: "none" }, 0.82)
          .to(conns, { autoAlpha: 0, ease: "none" }, 0.82);
      }

      /* ---------- FINAL — CTA breathes (scoped to the final scene) ---------- */
      const finalCta = el.querySelector("#scene-final [data-cta]");
      if (finalCta) {
        gsap.to(finalCta, {
          scale: 1.02,
          repeat: -1,
          yoyo: true,
          duration: 2.4,
          ease: "sine.inOut",
        });
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative z-10 font-sans">
      {/* ================================================================ */}
      {/* ACT I — THE QUESTION                                              */}
      {/* ================================================================ */}

      {/* ================= SCENE 1 — OVERTURE ================= */}
      <Scene id="overture" act={1}>
        <GridBackdrop opacity={0.35} />
        <GiantWord text="Aura" className="inset-x-0 top-[16%] text-center text-[22vw]" opacity={0.04} />
        <CornerFrame />
        <TechLabel n="SYS" className="left-[8%] top-[22%]">Aura/01 · Reference Series</TechLabel>
        <TechLabel n="LAT" className="right-[8%] top-[26%]">0.08 ms</TechLabel>
        <TechLabel n="FRQ" className="bottom-[24%] left-[10%]">20 Hz – 20 kHz</TechLabel>
        <TechLabel n="REV" className="bottom-[28%] right-[9%]">Prototype 1100</TechLabel>
        <ActMark act={1} />

        {/* Floating ambient particles — "sound becoming visible" */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[#57e6ff]/20"
              style={{
                width: `${2 + (i % 4)}px`,
                height: `${2 + (i % 4)}px`,
                left: `${5 + (i * 4.7) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                animation: `floatSlow ${6 + (i % 5) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Ambient glow orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(87,230,255,0.06) 0%, transparent 70%)",
            animation: "breathe 8s ease-in-out infinite",
          }}
        />

        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <div className="relative">
            <Halo />
            <p
              data-intro-sub
              className="mb-8 text-[11px] uppercase tracking-[0.55em] text-white/55"
              style={{ animation: "fadeSlideUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.4s both" }}
            >
              Aura · Reference Series
            </p>
            <h1
              data-intro
              className="max-w-[12ch] font-display text-[clamp(3rem,10vw,9.5rem)] font-bold uppercase leading-[0.95] tracking-tighter"
            >
              <span className="block overflow-hidden pb-1"><Chars text="Sound is" /></span>
              <span className="block overflow-hidden pb-2 text-white/45"><Chars text="Invisible." /></span>
            </h1>
          </div>
          <p
            className="mx-auto mt-10 max-w-md text-sm font-light leading-relaxed text-white/55"
            style={{ animation: "fadeSlideUp 1s cubic-bezier(0.23, 1, 0.32, 1) 1.8s both" }}
          >
            Before there was a product, there was a question:
            <br />
            what does silence look like when it listens back?
          </p>
          <div
            className="mt-16 flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-white/30"
            style={{ animation: "fadeSlideUp 1s cubic-bezier(0.23, 1, 0.32, 1) 2.4s both" }}
          >
            <span className="h-px w-10 bg-white/30" />
            Scroll to listen
            <span className="h-px w-10 bg-white/30" />
          </div>
          <div className="absolute bottom-10 opacity-50">
            <EqBars count={16} height="h-10" />
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 2 — MANIFESTO ================= */}
      <Scene id="manifesto" act={1}>
        <GridBackdrop opacity={0.25} />
        <GiantWord text="Listen" className="inset-x-0 top-1/2 -translate-y-1/2 text-center text-[20vw]" />
        <ActMark act={1} />
        <TechLabel n="DOC" className="left-[6%] top-[18%]">Manifesto · v4 final</TechLabel>
        <div data-content className="sticky top-0 flex h-screen items-center p-8 md:p-24">
          <div className="max-w-2xl space-y-10">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Chapter Zero · The Question
            </p>
            <h2 data-reveal className="font-display text-[clamp(1.9rem,4.5vw,4rem)] font-bold uppercase leading-[1.05] tracking-tighter">
              Four years.<br />
              <span className="text-white/55">Eleven hundred prototypes.</span><br />
              One obsession.
            </h2>
            <p data-reveal className="max-w-lg text-base font-light leading-relaxed text-white/65">
              We dismantled every great headphone ever made. We measured their
              curves, mapped their failures, argued about their souls. Then we
              threw the drawings away and started from the air itself.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="Years" v={<Counter value={4} />} />
              <SpecChip k="Prototypes" v={<Counter value={1100} />} />
              <SpecChip k="Compromises" v="Zero" />
            </div>
            <PrototypeTimeline />
            <p data-reveal className="max-w-md text-sm font-light leading-relaxed text-white/55">
              What follows is not a specification sheet.
              <br />
              It is a film. And you are holding the projector.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 3 — SIGNAL ================= */}
      <Scene id="signal" act={1}>
        <GridBackdrop opacity={0.3} />
        <TechLabel n="SIG" className="left-[12%] top-[34%]">Carrier detected</TechLabel>
        <TechLabel n="AMP" className="right-[12%] top-[62%]">Gain +0.0 dB</TechLabel>
        <ActMark act={1} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6">
          <p data-reveal className="mb-12 text-center text-[11px] uppercase tracking-[0.55em] text-white/55">
            Somewhere in the dark · a frequency is forming
          </p>
          <EqBars count={28} height="h-48" />
          <p data-reveal className="mt-12 max-w-sm text-center text-sm font-light leading-relaxed text-white/55">
            Twenty hertz. Twenty thousand. Everything between.
            <br />
            Keep scrolling — it is getting closer.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 4 — FREQUENCIES ================= */}
      <Scene id="frequencies" act={1}>
        <GiantWord text="Spectrum" className="inset-x-0 top-[12%] text-center text-[13vw]" opacity={0.04} />
        <CornerFrame />
        <ActMark act={1} />
        <div data-content className="sticky top-0 flex h-screen flex-col justify-center gap-10 px-8 md:p-20">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
            Act I · The full spectrum, held to account
          </p>
          <SpectrumCurve />
          <div className="grid max-w-4xl grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {[
              { v: <Counter value={20} />, u: "Hz", l: "Floor of hearing" },
              { v: <Counter value={20000} />, u: "Hz", l: "Ceiling of hearing" },
              { v: <Counter value={11} />, u: "mm", l: "Driver diameter" },
              { v: <Counter value={48} prefix="−" />, u: "dB", l: "Noise erased" },
            ].map((s, i) => (
              <div key={i} data-reveal className="border-l border-white/15 pl-5">
                <p className="font-display text-[clamp(1.8rem,3.6vw,3.2rem)] font-bold tracking-tighter">
                  {s.v}
                  <span className="ml-1 text-sm font-light text-white/40">{s.u}</span>
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/45">{s.l}</p>
              </div>
            ))}
          </div>
          <p data-reveal className="max-w-lg text-sm font-light leading-relaxed text-white/55">
            Numbers are not the music. But they are how we kept ourselves
            honest while building it.
          </p>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT II — GENESIS                                                  */}
      {/* ================================================================ */}

      {/* ================= SCENE 5 — ORIGIN ================= */}
      <Scene id="origin" act={2}>
        <GridBackdrop opacity={0.35} />
        <GiantWord text="Genesis" className="inset-x-0 top-[16%] text-center text-[18vw]" opacity={0.04} />
        <CornerFrame />
        <TechLabel n="LOG" className="left-[8%] top-[22%]">Archive · 2019</TechLabel>
        <TechLabel n="DAT" className="right-[8%] top-[28%]">1,100 prototypes</TechLabel>
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-center p-8 md:p-24">
          <div className="max-w-2xl space-y-10">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Act II · Where it began
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.5rem)] font-bold uppercase leading-[1.05] tracking-tighter">
              It started with<br />
              <span className="text-white/55">a broken pair.</span>
            </h2>
            <p data-reveal className="max-w-lg text-base font-light leading-relaxed text-white/65">
              2019. A drawer full of flagship earbuds, all failing the same
              test: do they disappear when you close your eyes? None did.
              So we took them apart. Measured every curve. Then threw
              the drawings away and started from the air itself.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="Year" v="2019" />
              <SpecChip k="Destroyed" v="47 pairs" />
              <SpecChip k="Measurments" v="12,000+" />
            </div>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 6 — PHILOSOPHY ================= */}
      <Scene id="philosophy" act={2}>
        <GiantWord text="Invisible" className="inset-x-0 bottom-[18%] text-center text-[16vw]" opacity={0.04} />
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <span data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.55em] text-white/55">
            Design principle 001
          </span>
          <blockquote data-reveal className="max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.8rem)] font-light uppercase leading-[1.2] tracking-[0.12em] text-white/75">
            The best technology<br />
            is the technology<br />
            you forget is there.
          </blockquote>
          <p data-reveal className="mt-10 max-w-md text-sm font-light leading-relaxed text-white/55">
            Every engineering decision was measured against one question:
            does this disappear? If you can feel the earbud, we failed.
            If you can hear the technology, we failed. The goal is absence —
            pure, unmediated listening.
          </p>
          <div data-reveal className="mt-12 grid grid-cols-3 gap-8">
            {["Invisible fit", "Invisible latency", "Invisible weight"].map((t) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-3 h-px w-12 bg-white/25" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 7 — OBSESSION ================= */}
      <Scene id="obsession" act={2}>
        <GridBackdrop opacity={0.3} />
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-end justify-start p-8 md:p-20">
          <div className="max-w-xl space-y-8">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-[#ffb45e]/80">
              The obsession
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5.5vw,5rem)] font-bold uppercase leading-none tracking-tighter">
              Eleven hundred<br /><span className="text-white/55">iterations.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              Prototypes that melted. Prototypes that cracked. Prototypes
              that sounded perfect but weighed too much. Each failure taught
              us something the success never could.
            </p>
            <div data-reveal className="grid grid-cols-2 gap-4">
              {["1,100", "47", "12,000", "0"].map((v, i) => (
                <div key={i} className="border-l border-white/15 pl-4">
                  <p className="font-display text-2xl font-bold tracking-tighter">{v}</p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {["prototypes", "flagships destroyed", "measurements", "compromises"][i]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT III — THE VESSEL                                              */}
      {/* ================================================================ */}

      {/* ================= SCENE 8 — APPROACH ================= */}
      <Scene id="approach" act={2}>
        <GridBackdrop opacity={0.4} />
        <GiantWord text="The Vessel" className="inset-x-0 top-[18%] text-center text-[15vw]" opacity={0.05} />
        <CornerFrame />
        <TechLabel n="OBJ" className="left-[8%] top-[26%]">001 · Unidentified</TechLabel>
        <TechLabel n="DST" className="right-[8%] top-[32%]">Closing</TechLabel>
        <TechLabel n="SEAM" className="bottom-[26%] left-[12%]">Sealed</TechLabel>
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-end p-8 pb-24 md:p-20 md:pb-28">
          <div className="relative w-full">
            <Halo className="absolute -top-20 left-1/3 h-96 w-2/3" />
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Act II · First Materialisation
            </p>
            <h2 data-reveal className="overflow-hidden font-display text-[clamp(2.6rem,7vw,7rem)] font-bold uppercase leading-none tracking-tighter">
              Something<br />approaches.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/65">
              Not the product. Not yet. First its architecture — a vessel
              machined like an instrument case. It rises out of the dark with
              nothing to show you. Almost nothing.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 6 — ORBIT ================= */}
      <Scene id="orbit" act={2}>
        <GridBackdrop opacity={0.25} />
        <TechLabel n="CAM" className="right-[10%] top-[20%]">Orbit · 14°/s</TechLabel>
        <TechLabel n="LUM" className="left-[9%] top-[64%]">Key light rising</TechLabel>
        <div className="absolute right-[10%] top-[6%] z-10" data-reveal>
          <CompassDial />
        </div>
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-end p-8 md:p-20">
          <div className="max-w-xl space-y-12 text-right">
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Watch it turn.<br />
              <span className="text-white/55">It hides nothing.</span>
            </h2>
            <p data-reveal className="ml-auto max-w-md text-sm font-light leading-relaxed text-white/60">
              A closed object in open space. Every face considered, every radius
              answered. The camera circles because confidence deserves study.
            </p>
            {[
              ["01", "Closed case only", "No reveal yet. Desire first."],
              ["02", "Full orbital pass", "360° of considered surface."],
              ["03", "Shadow discipline", "Light is spent where it matters."],
              ["04", "Silent approach", "It never announces itself."],
            ].map(([n, t, d]) => (
              <div key={n} data-reveal className="flex items-baseline justify-end gap-5 border-r border-white/15 pr-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-widest">{t}</p>
                  <p className="mt-1 text-sm font-light text-white/45">{d}</p>
                </div>
                <span className="font-mono text-xs text-white/45">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 7 — MATERIAL ================= */}
      <Scene id="material" act={2}>
        <GridBackdrop opacity={0.3} />
        <TechLabel n="SWP" className="right-[10%] top-[24%]">Light sweep active</TechLabel>
        <TechLabel n="SUR" className="right-[12%] top-[70%]">Ra 0.2 µm finish</TechLabel>
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-center p-8 md:p-20">
          <div className="max-w-xl space-y-10">
            <p data-reveal className="mb-2 font-mono text-xs uppercase tracking-[0.45em] text-[#57e6ff]/70">
              Material interrogation
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5.5vw,5rem)] font-bold uppercase leading-none tracking-tighter">
              Light does<br /><span className="text-white/55">the talking.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              One bar of light crosses the body. Watch the highlight travel the
              radius — this is how you judge metal without touching it.
            </p>
            <div className="flex flex-wrap gap-3">
              <SpecChip k="Billet" v="6061 Aluminium" />
              <SpecChip k="Coating" v="DLC · 3 µm" />
              <SpecChip k="Seam force" v="0.4 N" />
            </div>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 8 — CRAFT ================= */}
      <Scene id="craft" act={2}>
        <GiantWord text="Carved" className="inset-x-0 top-[20%] text-center text-[14vw]" opacity={0.04} />
        <ActMark act={2} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 px-8 md:p-20">
          <div className="hidden max-w-xs lg:block">
            <p data-reveal className="font-display text-[clamp(5rem,12vw,11rem)] font-black leading-none tracking-tighter text-white/[0.12]">
              <Countdown />
            </p>
            <p data-reveal className="mt-2 font-mono text-[10px] uppercase tracking-[0.35em] text-white/45">
              Minutes of machining per shell
            </p>
          </div>
          <div className="max-w-xl space-y-10 text-right">
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Carved,<br />
              <span className="text-white/55">not moulded.</span>
            </h2>
            {[
              ["01", "Single-billet aluminium", "CNC-milled for 41 minutes per shell."],
              ["02", "Diamond-like coating", "Three microns of scratch-proof calm."],
              ["03", "Magnetic seam", "Closes with a whisper at 0.4 newtons."],
              ["04", "Hand-polished radius", "Every edge softened by a human hand."],
            ].map(([n, t, d]) => (
              <div key={n} data-reveal className="flex items-baseline justify-end gap-5 border-r border-white/15 pr-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-widest">{t}</p>
                  <p className="mt-1 text-sm font-light text-white/45">{d}</p>
                </div>
                <span className="font-mono text-xs text-white/45">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT IV — MATERIAL WORLD                                          */}
      {/* ================================================================ */}

      {/* ================= SCENE 12 — GRAPHENE ================= */}
      <Scene id="graphene" act={4}>
        <GridBackdrop opacity={0.35} />
        <GiantWord text="Graphene" className="inset-x-0 top-[14%] text-center text-[16vw]" opacity={0.05} />
        <CornerFrame />
        <TechLabel n="MAT" className="left-[8%] top-[22%]">Atomic lattice · 2D</TechLabel>
        <TechLabel n="THK" className="right-[8%] top-[68%]">3 µm diaphragm</TechLabel>
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="max-w-xl space-y-10">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-[#57e6ff]/70">
              Material I · The soul of the driver
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              One atom thick.<br /><span className="text-white/55">Infinite resolve.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              Graphene is carbon arranged in a single atomic sheet — stronger
              than steel, lighter than air, and rigid enough to push sound
              without bending. We grow it, peel it, and suspend it across
              a gold surround like a drum skin for music.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="Thickness" v="3 µm" />
              <SpecChip k="Tensile" v="130 GPa" />
              <SpecChip k="Weight" v="0.77 mg" />
            </div>
          </div>
          <div className="hidden md:block">
            {/* Animated graphene lattice visualization */}
            <svg viewBox="0 0 200 200" className="h-64 w-64" aria-hidden>
              <defs>
                <linearGradient id="graphGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#57e6ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#57e6ff" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Hexagonal lattice pattern */}
              {Array.from({ length: 7 }).map((_, row) =>
                Array.from({ length: 7 - Math.abs(row - 3) }).map((_, col) => {
                  const x = 100 + (col - (7 - Math.abs(row - 3)) / 2) * 22 + (row % 2) * 11;
                  const y = 60 + row * 18;
                  return (
                    <g key={`${row}-${col}`}>
                      <circle cx={x} cy={y} r="2.5" fill="#57e6ff" opacity="0.7">
                        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" begin={`${(row + col) * 0.1}s`} repeatCount="indefinite" />
                      </circle>
                      {col < 6 - Math.abs(row - 3) && (
                        <line x1={x} y1={y} x2={x + 22} y2={y} stroke="url(#graphGrad)" strokeWidth="0.5" />
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 13 — CERAMIC ================= */}
      <Scene id="ceramic" act={4}>
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 p-8">
          <div className="text-center">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Material II · The shell
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              Ceramic gloss.<br /><span className="text-white/55">Fingerprint-proof.</span>
            </h2>
          </div>
          <div className="w-full max-w-2xl">
            {/* Material surface visualization */}
            <svg viewBox="0 0 600 120" className="h-24 w-full" aria-hidden>
              <defs>
                <linearGradient id="ceramGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#1a1c20" />
                  <stop offset="30%" stopColor="#2a2c31" />
                  <stop offset="50%" stopColor="#3a3c41" />
                  <stop offset="70%" stopColor="#2a2c31" />
                  <stop offset="100%" stopColor="#1a1c20" />
                </linearGradient>
              </defs>
              <rect x="0" y="20" width="600" height="80" fill="url(#ceramGrad)" rx="4" />
              <rect x="0" y="20" width="600" height="80" fill="none" stroke="rgba(255,255,255,0.15)" rx="4" />
              {/* Specular highlight traveling across */}
              <rect x="0" y="20" width="600" height="80" fill="url(#ceramGrad)" rx="4" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
              </rect>
              <g fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="0.3em" fill="rgba(255,255,255,0.6)">
                <text x="20" y="50">Ra 0.2 µm</text>
                <text x="20" y="70">10H Mohs</text>
                <text x="460" y="50">CLEARCOAT</text>
                <text x="460" y="70">0.08 ROUGHNESS</text>
              </g>
            </svg>
          </div>
          <p data-reveal className="max-w-md text-center text-sm font-light leading-relaxed text-white/65 md:text-base">
            A ceramic-gloss composite, vacuum-deposited in three layers.
            The surface rejects fingerprints, scratches, and time itself.
            Cold to the first touch. Warm after a minute. Always intentional.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 14 — ALUMINIUM ================= */}
      <Scene id="aluminium" act={4}>
        <GiantWord text="Forged" className="inset-x-0 bottom-[12%] text-center text-[15vw]" opacity={0.04} />
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="hidden md:block">
            {/* Aluminium billet cross-section */}
            <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden>
              <rect x="20" y="20" width="160" height="160" fill="none" stroke="rgba(255,255,255,0.2)" rx="8" />
              <rect x="40" y="40" width="120" height="120" fill="none" stroke="rgba(87,230,255,0.4)" rx="4" strokeDasharray="2 3" />
              <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(255,255,255,0.5)" />
              <circle cx="100" cy="100" r="5" fill="#57e6ff" />
              <g fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="0.2em" fill="rgba(255,255,255,0.6)">
                <text x="22" y="16">6061-T6</text>
                <text x="22" y="190">CNC · 41 MIN</text>
                <text x="140" y="16" textAnchor="end">BILLET</text>
              </g>
            </svg>
          </div>
          <div className="max-w-xl space-y-8">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Material III · The case
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Machined from<br /><span className="text-white/55">a single billet.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              6061-T6 aluminium. Forty-one minutes of CNC machining per case.
              Diamond-like coating at three microns. The seam closes at 0.4
              newtons — a whisper, not a click.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="Alloy" v="6061-T6" />
              <SpecChip k="Coating" v="DLC · 3 µm" />
              <SpecChip k="Recycled" v="71%" />
            </div>
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT V — EMERGENCE                                                 */}
      {/* ================================================================ */}

      {/* ================= SCENE 15 — GLIMPSE ================= */}
      <Scene id="glimpse" act={3}>
        <GridBackdrop opacity={0.3} />
        <CornerFrame />
        <TechLabel n="SEAM" className="left-[10%] top-[30%]">Integrity · releasing</TechLabel>
        <TechLabel n="PHO" className="right-[10%] top-[36%]">Photon leak 0.02 lm</TechLabel>
        <SeamLightLeak />
        <ActMark act={3} />
        <div data-content className="sticky top-0 flex h-screen items-start justify-start p-8 pt-28 md:p-20 md:pt-32">
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-[#57e6ff]/70">
              Seam integrity · releasing
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.4rem,6vw,5.8rem)] font-bold uppercase leading-none tracking-tighter">
              Almost.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/65">
              A hairline of light escapes the lid. Inside — something breathing,
              something charging, something waiting for you. We will not show
              you everything. Not yet. Desire needs darkness to grow.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 10 — FIRST LIGHT ================= */}
      <Scene id="firstlight" act={3}>
        <GiantWord text="Awaken" className="inset-x-0 bottom-[12%] text-center text-[13vw]" stroke="#57e6ff" opacity={0.06} />
        <ActMark act={3} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <p data-reveal className="mb-8 text-[11px] uppercase tracking-[0.5em] text-white/55">
            Interior illumination · engaged
          </p>
          <h2 data-reveal className="max-w-[14ch] font-display text-[clamp(2rem,5.5vw,5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Light finds<br /><span className="text-white/55">what was made</span><br />for it.
          </h2>
          <p data-reveal className="mt-10 max-w-md text-sm font-light leading-relaxed text-white/60">
            Two sculpted wells. A halo of charge light. The lid opens like a
            jewellery box that happens to contain the future of your hearing.
          </p>
          <p data-reveal className="mt-8 font-mono text-[10px] uppercase tracking-[0.45em] text-[#57e6ff]/70">
            Hold. Anticipation is a feature.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 11 — RISE ================= */}
      <Scene id="rise" act={3}>
        <GridBackdrop opacity={0.35} />
        <TechLabel n="CH-L" className="left-[10%] top-[38%]">Rising</TechLabel>
        <TechLabel n="CH-R" className="right-[10%] top-[52%]">Standby · next</TechLabel>
        <RisingParticles />
        <ActMark act={3} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-end justify-center p-8 text-right md:p-20">
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Emergence · one at a time
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.4rem,6.5vw,6rem)] font-bold uppercase leading-none tracking-tighter">
              They remember<br /><span className="text-white/55">flight.</span>
            </h2>
            <p data-reveal className="mt-8 ml-auto max-w-md text-base font-light leading-relaxed text-white/65">
              The first lifts clear of its well. Then — a beat behind, on its
              own schedule — the second. No synchrony. Machines that rise like
              performers taking their cue.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 12 — SEPARATION ================= */}
      <Scene id="separation" act={3}>
        <TechLabel n="L" className="left-[12%] top-[44%]">Channel left</TechLabel>
        <TechLabel n="R" className="right-[12%] top-[56%]">Channel right</TechLabel>
        <ActMark act={3} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.5em] text-white/55">
            Stage VII · Two objects
          </p>
          <h2 data-reveal className="font-display text-[clamp(2.4rem,6.5vw,6rem)] font-bold uppercase leading-none tracking-tighter">
            Two instruments.<br /><span className="text-white/55">One score.</span>
          </h2>
          <StereoField />
          <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
            They drift apart until the air between them is unmistakable.
            Stereo is not a specification. It is distance, respected.
          </p>
          <div data-reveal className="flex gap-4">
            <SpecChip k="Left" v="Ch-L · Mirror" />
            <SpecChip k="Right" v="Ch-R · Master" />
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT VI — ACOUSTIC ARCHITECTURE                                    */}
      {/* ================================================================ */}

      {/* ================= SCENE 19 — HERO REVEAL ================= */}
      <Scene id="hero" act={4}>
        <CornerFrame />
        <TechLabel n="EXP" className="left-[8%] top-[24%]">Aura One · Final</TechLabel>
        <TechLabel n="WGT" className="right-[8%] top-[68%]">11 g per bud</TechLabel>
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <p data-reveal className="mb-8 font-mono text-xs uppercase tracking-[0.6em] text-white/55">
            Act IV · The Reveal
          </p>
          <div className="relative">
            <Halo />
            <h2 className="font-display text-[clamp(4rem,16vw,16rem)] font-bold uppercase leading-[0.85] tracking-tighter">
              <span data-reveal className="block overflow-hidden pb-1">Aura</span>
              <span
                data-reveal
                className="block overflow-hidden pb-3"
                style={{ color: "rgba(87,230,255,0.85)", textShadow: "0 0 60px rgba(87,230,255,0.35)" }}
              >
                One.
              </span>
            </h2>
          </div>
          <p data-reveal className="mt-10 max-w-lg text-base font-light leading-relaxed text-white/65 md:text-lg">
            Eleven grams each. Every curve earning its place in the light.
            This is not an accessory. It is an instrument you happen to wear.
          </p>
          <p data-reveal className="mt-6 font-mono text-[10px] uppercase tracking-[0.45em] text-[#ffb45e]/80">
            This is the moment. Remember where you were.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 14 — WAVES ================= */}
      <Scene id="waves" act={4}>
        <GridBackdrop opacity={0.3} />
        <TechLabel n="OSC" className="left-[10%] top-[28%]">Oscillator live</TechLabel>
        <TechLabel n="THD" className="right-[10%] top-[66%]">Distortion &lt; 0.08 %</TechLabel>
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-[#57e6ff]/80">
            Feature I · Acoustics
          </p>
          <h2 data-reveal className="font-display text-[clamp(2.4rem,7vw,6.5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Sound,<br /><span className="text-white/55">made physical.</span>
          </h2>
          <WaveformScrub />
          <p data-reveal className="max-w-md text-sm font-light leading-relaxed text-white/60 md:text-base">
            You are inside the acoustic chamber. Twenty-micron waves roll past
            you — this is what 20Hz feels like. A graphene diaphragm so rigid
            it refuses to distort, even when the music begs it to.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 15 — DRIVER ================= */}
      <Scene id="driver" act={4}>
        <GiantWord text="Diaphragm" className="inset-x-0 top-[14%] text-center text-[12vw]" opacity={0.04} />
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-24">
          <div className="hidden md:block">
            <DriverCrossSection />
          </div>
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Acoustic architecture · I
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              The driver<br /><span className="text-white/55">is the argument.</span>
            </h2>
            <p data-reveal className="mt-8 max-w-md text-sm font-light leading-relaxed text-white/65 md:text-base">
              An 11mm graphene diaphragm, three microns thick, suspended by a
              gold surround tuned like a violin bridge. It moves less than a
              micron — and that micron is where music lives.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <SpecChip k="Diaphragm" v="Graphene · 3 µm" />
              <SpecChip k="Surround" v="Gold suspension" />
              <SpecChip k="Excursion" v="< 1 micron" />
            </div>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 16 — INTERLUDE ================= */}
      <Scene id="interlude" act={4}>
        <GridBackdrop opacity={0.2} />
        <ActMark act={4} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <span
            data-reveal
            className="font-serif text-[10rem] leading-none text-white/[0.10]"
          >
            “
          </span>
          <blockquote data-reveal className="-mt-10 max-w-3xl font-display text-[clamp(1.6rem,4vw,3.4rem)] font-light uppercase leading-[1.25] tracking-[0.12em] text-white/75">
            We didn&apos;t build a speaker.
            <br />
            We built a listener.
          </blockquote>
          <p data-reveal className="mt-10 font-mono text-[10px] uppercase tracking-[0.4em] text-white/35">
            Aura Acoustic Lab · Tuning notes · 2026
          </p>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT VII — INTERNAL COMPONENTS                                     */}
      {/* ================================================================ */}

      {/* ================= SCENE 23 — ENGINEERING INTRO ================= */}
      <Scene id="engineering" act={5}>
        <GridBackdrop opacity={0.3} />
        <ActMark act={5} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-center gap-16 px-6 text-center">
          <div className="relative">
            <EarbudBlueprint />
          </div>
          <div className="max-w-md text-left">
            <p data-reveal className="mb-8 font-mono text-xs uppercase tracking-[0.6em] text-white/55">
              Act V · Engineering Film
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,6vw,5.5rem)] font-bold uppercase leading-[1.05] tracking-tighter">
              You have seen the face.<br />
              <span className="text-white/55">Now meet the organs.</span>
            </h2>
            <p data-reveal className="mt-8 max-w-md text-sm font-light leading-relaxed text-white/65">
              Hold still. The shell will open along seams no eye can find, and
              everything inside will hold its position for inspection.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 18 — DECONSTRUCTION ================= */}
      <Scene id="explosion" act={5}>
        <GiantWord text="Deconstructed" className="inset-x-0 top-[16%] text-center text-[13vw]" opacity={0.05} />
        <div data-content className="sticky top-0 h-screen">
          {/* SVG layer that draws connection lines from labels to the centre mass */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            data-conn
          >
            {PART_LABELS.map((l) => (
              <line
                key={l.n}
                data-conn-line={l.n}
                x1="50%"
                y1="50%"
                x2={l.pos.includes("text-right") ? "85%" : "15%"}
                y2={l.pos.includes("top-[9%]") || l.pos.includes("top-[19%]") ? "22%" : l.pos.includes("bottom") ? "78%" : "50%"}
                stroke="rgba(87,230,255,0.45)"
                strokeWidth="0.6"
                strokeDasharray="2 3"
              />
            ))}
          </svg>
          <p data-reveal className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.5em] text-white/55">
            Every layer. Engineered.
          </p>
          {PART_LABELS.map((l) => {
            const mirrored = l.pos.includes("text-right");
            return (
              <div key={l.n} data-part className={`absolute ${l.pos} max-w-[220px]`}>
                <div
                  className={`mb-3 h-px w-12 bg-gradient-to-r ${
                    mirrored ? "ml-auto from-transparent via-[#57e6ff]/60 to-white/60" : "from-white/60 via-white/20 to-transparent"
                  }`}
                />
                <div className={`flex items-center gap-3 ${mirrored ? "flex-row-reverse" : ""}`}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#57e6ff]/60 font-mono text-[10px] text-[#57e6ff]/90">
                    {l.n}
                  </span>
                  <p className="font-mono text-[10px] text-white/55">{l.n}</p>
                </div>
                <p className={`mt-1 text-sm font-semibold uppercase tracking-widest ${mirrored ? "text-right" : ""}`}>
                  {l.name}
                </p>
                <p className={`mt-1 text-xs font-light text-white/55 ${mirrored ? "text-right" : ""}`}>
                  {l.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Scene>

      {/* ================= SCENE 19 — CHAPTER I: THE SHELL ================= */}
      <Scene id="shell" act={5}>
        <GridBackdrop opacity={0.25} />
        <ActMark act={5} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 p-8">
          <div className="text-center">
            <p data-reveal className="mb-6 font-display text-[clamp(4rem,10vw,9rem)] font-black leading-none tracking-tighter text-white/[0.07]">
              I
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              A shell<br /><span className="text-white/55">with a duty of care.</span>
            </h2>
          </div>
          <div className="w-full max-w-2xl">
            <ShellLayers />
          </div>
          <p data-reveal className="max-w-md text-center text-sm font-light leading-relaxed text-white/65 md:text-base">
            Ceramic-gloss outside, damping composite within. The shell does
            three jobs at once: seal the chamber, kill resonance, survive
            your pocket. It makes all three look effortless.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 20 — CHAPTER II: PROCESSOR ================= */}
      <Scene id="processor" act={5}>
        <ActMark act={5} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-24">
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-display text-[clamp(4rem,10vw,9rem)] font-black leading-none tracking-tighter text-white/[0.07]">
              II
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              Three nanometres<br /><span className="text-white/55">of decision-making.</span>
            </h2>
            <p data-reveal className="mt-8 max-w-md text-sm font-light leading-relaxed text-white/65 md:text-base">
              The custom Aura Silicon core runs adaptive EQ, hybrid ANC and the
              Bluetooth 6.0 stack simultaneously — at one-fifth the power of
              the off-the-shelf parts we refused to use.
            </p>
          </div>
          <div className="hidden md:block">
            <ProcessorDie />
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT VIII — SOUND ENGINEERING                                      */}
      {/* ================================================================ */}

      {/* ================= SCENE 27 — CHAPTER III: THE CELL ================= */}
      <Scene id="cell" act={6}>
        <GridBackdrop opacity={0.25} />
        <ActMark act={6} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 p-8">
          <div className="text-center">
            <p data-reveal className="mb-6 font-display text-[clamp(4rem,10vw,9rem)] font-black leading-none tracking-tighter text-white/[0.07]">
              III
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              A steel-cased<br /><span className="text-white/55">promise.</span>
            </h2>
          </div>
          <div className="w-full max-w-2xl">
            <BatteryFill />
          </div>
          <p data-reveal className="max-w-md text-center text-sm font-light leading-relaxed text-white/65 md:text-base">
            Eight hours in each bud. Forty-eight with the vessel. A steel
            jacket around the cell because energy this dense deserves armour.
            Charge-level light visible from across the room.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 22 — ANC ================= */}
      <Scene id="anc" act={6}>
        <TechLabel n="ANC" className="left-[10%] top-[26%]">Hybrid · feed-forward + feedback</TechLabel>
        <TechLabel n="MIC" className="right-[10%] top-[70%]">6 microphones</TechLabel>
        <ActMark act={6} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-8 text-center md:p-20">
          <div>
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#ff6a4d]/80">
              Feature II · −48 dB · Hybrid ANC
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold uppercase leading-none tracking-tighter">
              Silence<br />the world.
            </h2>
          </div>
          <div className="w-full max-w-3xl">
            <AncInterference />
          </div>
          <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
            Eight hundred samples per second, inverted and erased. Six
            microphones listen so you don&apos;t have to. Watch the red chaos
            dissolve against the array — that is the sound of nothing.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 23 — POWER ================= */}
      <Scene id="power" act={6}>
        <TechLabel n="PWR" className="right-[10%] top-[24%]">Pathway telemetry</TechLabel>
        <ActMark act={6} />
        <div data-content className="sticky top-0 flex h-screen items-end justify-end p-8 md:p-20">
          <div className="max-w-2xl text-right">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#ffb45e]/90">
              Feature III · Energy architecture
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold uppercase leading-none tracking-tighter">
              48 hours.<br />
              <span className="text-white/55">Zero anxiety.</span>
            </h2>
            <p data-reveal className="mt-8 text-base font-light leading-relaxed text-white/65">
              Follow the current: a steel-case cell feeding a 3nm amplifier
              through pathways thinner than a human hair. Ten minutes of
              charge buys five hours of soundtrack.
            </p>
            <div className="mt-10 w-full">
              <CurrentPath />
            </div>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 24 — CONNECTIVITY ================= */}
      <Scene id="connect" act={6}>
        <GridBackdrop opacity={0.3} />
        <ActMark act={6} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="hidden md:block">
            <SignalRings count={5} />
          </div>
          <div className="max-w-xl md:text-right">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#57e6ff]/80">
              Feature IV · Bluetooth 6.0 · LE Audio
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.4rem,6.5vw,6rem)] font-bold uppercase leading-none tracking-tighter">
              Invisible wire.<br /><span className="text-white/55">Zero doubt.</span>
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/65 md:ml-auto">
              Dual antennas woven into the structure itself. Multipoint pairing
              across three devices. Auracast broadcast for sharing a moment
              with a stranger on a train.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT IX — RESONANCE                                                */}
      {/* ================================================================ */}

      {/* ================= SCENE 31 — RESONANCE ================= */}
      <Scene id="resonance" act={9}>
        <GridBackdrop opacity={0.3} />
        <GiantWord text="Resonance" className="inset-x-0 top-[14%] text-center text-[14vw]" opacity={0.05} />
        <CornerFrame />
        <TechLabel n="FRQ" className="left-[10%] top-[26%]">Harmonic series · live</TechLabel>
        <TechLabel n="THD" className="right-[10%] top-[70%]">Total harmonic distortion</TechLabel>
        <ActMark act={9} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-[#57e6ff]/80">
            Act IX · Sound Made Visible
          </p>
          <h2 data-reveal className="font-display text-[clamp(2.4rem,7vw,6.5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Feel the<br /><span className="text-white/55">harmonics.</span>
          </h2>
          {/* Animated resonance rings */}
          <div className="relative h-48 w-48">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-[#57e6ff]/30"
                style={{
                  animation: `resonancePulse ${2 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  transform: `scale(${0.3 + i * 0.18})`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-[#57e6ff] shadow-[0_0_20px_rgba(87,230,255,0.6)]" />
            </div>
          </div>
          <style>{`
            @keyframes resonancePulse {
              0%, 100% { opacity: 0.2; transform: scale(var(--s, 0.3)); }
              50% { opacity: 0.6; transform: scale(calc(var(--s, 0.3) + 0.15)); }
            }
          `}</style>
          <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
            Every object has a resonant frequency — the note where it vibrates
            most freely. The Aura One is tuned so its natural resonance falls
            outside the audible range. What you hear is pure signal. What you
            don&apos;t hear is the earbud itself.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 32 — HARMONICS ================= */}
      <Scene id="harmonics" act={9}>
        <ActMark act={9} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="max-w-xl space-y-10">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Harmonic analysis
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              Overtones that<br /><span className="text-white/55">know their place.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              A violin sounds like a violin because of its overtones — the
              subtle harmonics stacked above the fundamental. The Aura One
n              reproduces these faithfully, from the warm 2nd harmonic to the
              shimmer of the 16th.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="THD" v="< 0.08%" />
              <SpecChip k="Harmonics" v="1st – 16th" />
              <SpecChip k="Response" v="20 Hz – 20 kHz" />
            </div>
          </div>
          <div className="hidden md:block">
            {/* Harmonic series visualization */}
            <svg viewBox="0 0 200 300" className="h-72 w-48" aria-hidden>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const y = 20 + (n - 1) * 45;
                const amp = 30 / n;
                const freq = n * 0.8;
                const points = Array.from({ length: 41 })
                  .map((_, i) => {
                    const x = (i / 40) * 200;
                    const yy = y + Math.sin((i / 40) * Math.PI * 2 * freq) * amp;
                    return `${x},${yy}`;
                  })
                  .join(" ");
                return (
                  <g key={n}>
                    <polyline points={points} fill="none" stroke="#57e6ff" strokeWidth="1" opacity={0.7 - n * 0.08} />
                    <text x="8" y={y - 8} fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(255,255,255,0.4)" letterSpacing="0.2em">
                      {n === 1 ? "FUND" : `${n}TH`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 33 — OVERTONES ================= */}
      <Scene id="overtones" act={9}>
        <GridBackdrop opacity={0.25} />
        <ActMark act={9} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <h2 data-reveal className="font-display text-[clamp(2rem,5.5vw,5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Where music<br /><span className="text-white/55">lives between notes.</span>
          </h2>
          <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
            The space between notes is where emotion lives. Reverb tails,
            breath sounds, the decay of a piano string — these are the
            overtones that make recorded music feel alive. The Aura One
            preserves every one.
          </p>
          <div data-reveal className="mt-4 flex items-center gap-6">
            {["Warmth", "Air", "Decay", "Space"].map((t, i) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-2 h-16 w-px" style={{ background: `linear-gradient(to top, transparent, rgba(87,230,255,${0.8 - i * 0.15}), transparent)` }} />
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT X — EXPERIENCE                                                */}
      {/* ================================================================ */}

      {/* ================= SCENE 34 — SPATIAL ================= */}
      <Scene id="spatial" act={7}>
        <GridBackdrop opacity={0.3} />
        <TechLabel n="IMU" className="left-[10%] top-[24%]">Head-tracking · 1000 Hz</TechLabel>
        <ActMark act={7} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="max-w-xl">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-[#b48cff]/90">
              Feature IV · 360° soundstage
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.4rem,6.5vw,6rem)] font-bold uppercase leading-none tracking-tighter">
              The room<br />follows you.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-base font-light leading-relaxed text-white/65">
              Head-tracked spatial audio pins every instrument to a point in
              real space. Turn your head — the orchestra stays exactly where
              the recording put it.
            </p>
          </div>
          <div className="hidden md:block">
            <SpatialField />
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 26 — TOUCH ================= */}
      <Scene id="touch" act={7}>
        <GiantWord text="Surface" className="inset-x-0 top-[22%] text-center text-[14vw]" opacity={0.04} />
        <ActMark act={7} />
        <div data-content className="sticky top-0 flex h-screen flex-col justify-center p-8 md:p-20">
          <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
            Experience · Craftsmanship
          </p>
          <h2 data-reveal className="max-w-[16ch] font-display text-[clamp(2.2rem,5.5vw,5rem)] font-bold uppercase leading-[1.02] tracking-tighter">
            Materials chosen by touch,<br />
            <span className="text-white/55">kept by trust.</span>
          </h2>
          <MaterialSwatches />
          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
            {[
              ["Ceramic-gloss shell", "Fingerprint-proof, cold to the first touch, warm after a minute."],
              ["Medical silicone", "Hypoallergenic tips in four sizes, memory-set for your canal."],
              ["Sapphire nozzle mesh", "Earwax, lint and time itself — none get through."],
              ["Recycled aluminium", "71% post-industrial. Luxury without the guilt line-item."],
            ].map(([t, d]) => (
              <div key={t} data-reveal className="border-l border-white/15 pl-5">
                <p className="text-sm font-semibold uppercase tracking-widest">{t}</p>
                <p className="mt-1.5 text-xs font-light leading-relaxed text-white/45">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT XI — ECOSYSTEM                                                */}
      {/* ================================================================ */}

      {/* ================= SCENE 36 — FAMILY ================= */}
      <Scene id="family" act={8}>
        <GridBackdrop opacity={0.3} />
        <ActMark act={8} />
        <div data-content className="sticky top-0 flex h-screen flex-col justify-center p-8 md:p-20">
          <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/30">
            Act VIII · The Family
          </p>
          <h2 data-reveal className="font-display text-[clamp(2.2rem,5.5vw,5rem)] font-bold uppercase leading-none tracking-tighter">
            One aura.<br />
            <span className="text-white/40">Many instruments.</span>
          </h2>
          <div className="mt-12 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              ["Aura Buds Pro", "Companion buds", "For training days. Same tuning DNA, sweat-sealed.", "$199"],
              ["Aura Deck", "Desktop DAC", "A matchbox-sized DAC feeding your Aura stack at 32-bit.", "$299"],
              ["Aura Loop", "Lossless link", "Wi-Fi 7 bridge for studio-grade wireless at home.", "$149"],
            ].map(([name, kind, d, price]) => (
              <div key={name} data-reveal className="border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/25">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">{kind}</p>
                <p className="mt-3 font-display text-lg font-bold uppercase tracking-wide">{name}</p>
                <p className="mt-2 min-h-[3.5rem] text-xs font-light leading-relaxed text-white/45">{d}</p>
                <p className="mt-4 font-mono text-sm text-[#57e6ff]/90">{price}</p>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 28 — VERSUS ================= */}
      <Scene id="versus" act={8}>
        <ActMark act={8} />
        <div data-content className="sticky top-0 flex h-screen flex-col justify-center px-8 md:px-20">
          <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.2rem)] font-bold uppercase leading-none tracking-tighter">
            Versus<br /><span className="text-white/55">everything else.</span>
          </h2>
          <div className="mt-12 max-w-3xl">
            <ComparisonBar
              label="Total playback"
              ours="48 h"
              theirs="28 h"
              oursPct={92}
              theirsPct={55}
            />
            <ComparisonBar
              label="Noise cancelled"
              ours="−48 dB"
              theirs="−40 dB"
              oursPct={95}
              theirsPct={70}
            />
            <ComparisonBar
              label="Codec ceiling"
              ours="LDAC · aptX Lossless"
              theirs="AAC only"
              oursPct={88}
              theirsPct={40}
            />
            <ComparisonBar
              label="Driver material"
              ours="Graphene · 3 µm"
              theirs="Plastic composite"
              oursPct={92}
              theirsPct={45}
            />
            <ComparisonBar
              label="Case machining"
              ours="CNC aluminium"
              theirs="Injected polymer"
              oursPct={90}
              theirsPct={35}
            />
          </div>
          <p data-reveal className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
            Category averages · flagship tier · 2026
          </p>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT XII — PRECISION ASSEMBLY                                      */}
      {/* ================================================================ */}

      {/* ================= SCENE 38 — ASSEMBLY ================= */}
      <Scene id="assembly" act={12}>
        <GridBackdrop opacity={0.35} />
        <GiantWord text="Assembly" className="inset-x-0 top-[16%] text-center text-[14vw]" opacity={0.04} />
        <CornerFrame />
        <TechLabel n="LOC" className="left-[8%] top-[22%]">Cleanroom · ISO 5</TechLabel>
        <TechLabel n="TOL" className="right-[8%] top-[68%]">± 2 µm tolerance</TechLabel>
        <ActMark act={12} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-between gap-12 p-8 md:p-20">
          <div className="max-w-xl space-y-10">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-[#ffb45e]/80">
              Act XII · Where precision meets purpose
            </p>
            <h2 data-reveal className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tighter">
              Hand-assembled.<br /><span className="text-white/55">Machine-verified.</span>
            </h2>
            <p data-reveal className="max-w-md text-base font-light leading-relaxed text-white/65">
              In an ISO 5 cleanroom, forty-seven components come together
              in a sequence refined over eleven hundred prototypes. Every
              joint is laser-welded. Every seal is pressure-tested. Every
              unit is listened to by a human being before it leaves.
            </p>
            <div data-reveal className="flex flex-wrap gap-3">
              <SpecChip k="Components" v="47 per unit" />
              <SpecChip k="Tolerance" v="± 2 µm" />
              <SpecChip k="Test" v="100% listen" />
            </div>
          </div>
          <div className="hidden md:block">
            {/* Assembly sequence visualization */}
            <svg viewBox="0 0 200 300" className="h-72 w-48" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const y = 30 + i * 42;
                const x = 100;
                const opacity = 0.3 + i * 0.12;
                return (
                  <g key={i}>
                    <rect x={x - 40} y={y} width="80" height="28" fill="none" stroke="#57e6ff" strokeWidth="0.5" opacity={opacity} rx="2" />
                    <line x1={x} y1={y + 28} x2={x} y2={y + 42} stroke="#57e6ff" strokeWidth="0.5" opacity={opacity * 0.7} />
                    <text x={x + 48} y={y + 18} fontFamily="ui-monospace, monospace" fontSize="7" fill="rgba(255,255,255,0.5)" letterSpacing="0.15em">
                      {["DIAPHRAGM", "COIL", "MAGNET", "PCB", "SHELL", "SEAL"][i]}
                    </text>
                  </g>
                );
              })}
              <text x="100" y="285" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(87,230,255,0.7)" letterSpacing="0.2em">
                SEQUENCE · 41 MIN
              </text>
            </svg>
          </div>
        </div>
      </Scene>

      {/* ================= SCENE 39 — CALIBRATION ================= */}
      <Scene id="calibration" act={12}>
        <ActMark act={12} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 p-8">
          <div className="text-center">
            <p data-reveal className="mb-6 font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Calibration · every unit
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              Tuned to<br /><span className="text-white/55">a reference curve.</span>
            </h2>
          </div>
          <div className="w-full max-w-2xl">
            {/* Frequency response calibration curve */}
            <svg viewBox="0 0 600 120" className="h-28 w-full" aria-hidden>
              <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(255,255,255,0.1)" />
              <path
                d="M0,65 Q60,58 120,60 T240,58 T360,60 T480,59 T600,60"
                fill="none"
                stroke="#57e6ff"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <path
                d="M0,65 Q60,62 120,63 T240,61 T360,63 T480,62 T600,63"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />
              <g fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(255,255,255,0.5)" letterSpacing="0.2em">
                <text x="10" y="20">TARGET</text>
                <text x="10" y="32" fill="rgba(87,230,255,0.7)">ACTUAL</text>
                <text x="540" y="110">± 0.5 dB</text>
              </g>
            </svg>
          </div>
          <p data-reveal className="max-w-md text-center text-sm font-light leading-relaxed text-white/65 md:text-base">
            Every unit is measured against a reference curve. Deviations
            greater than 0.5 dB are rejected. The result: two earbuds that
            sound identical, even though they were assembled by different
            technicians on different days.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 40 — CERTIFICATION ================= */}
      <Scene id="certification" act={12}>
        <GridBackdrop opacity={0.25} />
        <ActMark act={12} />
        <div data-content className="sticky top-0 flex h-screen items-center justify-center p-8 md:p-20">
          <div className="max-w-2xl space-y-10 text-center">
            <p data-reveal className="font-mono text-xs uppercase tracking-[0.45em] text-white/55">
              Final verification
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.4rem)] font-bold uppercase leading-none tracking-tighter">
              Every unit<br /><span className="text-white/55">listened to.</span>
            </h2>
            <div data-reveal className="grid grid-cols-3 gap-6">
              {["Frequency sweep", "Phase coherence", "Leakage test"].map((t) => (
                <div key={t} className="border border-white/10 bg-white/[0.02] px-4 py-5 backdrop-blur-sm">
                  <div className="mx-auto mb-3 h-8 w-8 rounded-full border border-[#57e6ff]/50" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{t}</p>
                </div>
              ))}
            </div>
            <p data-reveal className="max-w-md mx-auto text-sm font-light leading-relaxed text-white/55">
              Automated at every step, verified by ear at the last.
              Technology ensures consistency. Humanity ensures soul.
            </p>
          </div>
        </div>
      </Scene>

      {/* ================================================================ */}
      {/* ACT XIII — FUTURE OF LISTENING                                    */}
      {/* ================================================================ */}

      {/* ================= SCENE 41 — REASSEMBLY ================= */}
      <Scene id="reassembly" act={9}>
        <GridBackdrop opacity={0.25} />
        <ActMark act={9} />
        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
          <ConvergingParticles />
          <p data-reveal className="mb-8 font-mono text-xs uppercase tracking-[0.6em] text-white/55">
            Act IX · Everything Returns
          </p>
          <h2 data-reveal className="font-display text-[clamp(1.6rem,4vw,3.4rem)] font-light uppercase tracking-[0.35em] text-white/75">
            Perfectly in tune.
          </h2>
          <p data-reveal className="mt-8 max-w-sm text-sm font-light leading-relaxed text-white/55">
            Every part finds its way home. The magnetic clack you just heard?
            That was forty-one minutes of machining agreeing with itself.
          </p>
        </div>
      </Scene>

      {/* ================= SCENE 42 — FINAL HERO ================= */}
      <Scene id="final" act={9}>
        <GiantWord text="Forever" className="inset-x-0 top-[14%] text-center text-[15vw]" opacity={0.03} />
        <CornerFrame />
        <TechLabel n="EOF" className="left-[8%] top-[26%]">End of transmission</TechLabel>

        {/* Cinematic sound wave rings expanding outward */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-[#57e6ff]/10"
              style={{
                width: `${30 + i * 15}vmin`,
                height: `${30 + i * 15}vmin`,
                animation: `breathe ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* Floating particles converging toward center */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const dist = 20 + (i % 5) * 8;
            return (
              <span
                key={i}
                className="absolute rounded-full bg-[#57e6ff]/30"
                style={{
                  width: `${1 + (i % 3)}px`,
                  height: `${1 + (i % 3)}px`,
                  left: `${50 + Math.cos(angle) * dist}%`,
                  top: `${50 + Math.sin(angle) * dist}%`,
                  animation: `floatSlow ${5 + (i % 4) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            );
          })}
        </div>

        {/* Ambient glow orb — the product breathes */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(87,230,255,0.08) 0%, transparent 60%)",
            animation: "breathe 6s ease-in-out infinite",
          }}
        />

        <div data-content className="sticky top-0 flex h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <p
            data-reveal
            className="mb-4 text-[11px] uppercase tracking-[0.5em] text-white/45"
            style={{ animation: "fadeSlideUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both" }}
          >
            The future of listening ships spring 2027
          </p>
          <div className="relative">
            <Halo />
            <h2 className="font-display text-[clamp(3.4rem,12vw,11rem)] font-bold uppercase leading-[0.95] tracking-tighter">
              <span data-reveal className="block">Hear</span>
              <span
                data-reveal
                className="block"
                style={{
                  color: "rgba(87,230,255,0.85)",
                  textShadow: "0 0 60px rgba(87,230,255,0.35), 0 0 120px rgba(87,230,255,0.15)",
                }}
              >
                Everything.
              </span>
            </h2>
          </div>

          {/* Spec row — the final specs the user sees */}
          <div data-reveal className="mt-4 flex flex-wrap items-center justify-center gap-6">
            {[
              { k: "11 g", l: "per bud" },
              { k: "48 h", l: "battery" },
              { k: "−48 dB", l: "ANC" },
              { k: "3 nm", l: "silicon" },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <p className="font-display text-lg font-bold tracking-tight" style={{ color: "rgba(87,230,255,0.9)" }}>{s.k}</p>
                <p className="text-[8px] uppercase tracking-[0.3em] text-white/30">{s.l}</p>
              </div>
            ))}
          </div>

          <p
            data-reveal
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#ffb45e]/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.35em] text-[#ffb45e]/90"
          >
            Limited to first 1000
          </p>
          <button
            data-cta
            data-hover
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("[AURA] pre-order clicked");
            }}
            className="cta-glow btn-glow mt-6 inline-flex items-center gap-3 rounded-full bg-white px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] text-black transition-all duration-300 hover:scale-[1.03] hover:bg-[#57e6ff]"
          >
            <span>Pre-Order</span>
            <span className="font-mono">$349</span>
            <span aria-hidden>→</span>
          </button>

          {/* Final line — the closing statement */}
          <p data-reveal className="mt-4 max-w-sm text-[11px] font-light leading-relaxed text-white/35">
            Eleven grams. Forty-eight hours. Three nanometres.
            <br />The future of wireless audio.
          </p>

          <div className="mt-12 flex w-full items-center justify-between px-8 text-[10px] uppercase tracking-[0.3em] text-white/30 md:px-20">
            <span>Aura Audio © 2026</span>
            <span>Designed in silence</span>
          </div>
        </div>
      </Scene>
    </div>
  );
}
