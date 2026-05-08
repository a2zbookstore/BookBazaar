import { useState, useEffect, useRef, useCallback } from "react";
import { X, Gift, Copy, Check, ShoppingBag, Clock, Zap, Sparkles } from "lucide-react";

const SPINNER_SHOWN_KEY = "bb_spinner_first_shown";

const PRIZES = [
  { label: "10% OFF",       grad: ["#FF6B6B", "#FF4757"], text: "#fff" },
  { label: "Free Bookmark", grad: ["#4ECDC4", "#26de81"], text: "#fff" },
  { label: "5% OFF",        grad: ["#45B7D1", "#2980B9"], text: "#fff" },
  { label: "Try Again",     grad: ["#b2bec3", "#636e72"], text: "#fff" },
  { label: "15% OFF",       grad: ["#F9CA24", "#F0932B"], text: "#1a1a2e" },
  { label: "Free Shipping", grad: ["#a29bfe", "#6C5CE7"], text: "#fff" },
  { label: "Try Again",     grad: ["#b2bec3", "#636e72"], text: "#fff" },
  { label: "20% OFF",       grad: ["#fd79a8", "#e84393"], text: "#fff" },
];

const SEGMENT_ANGLE = 360 / PRIZES.length;

function getCouponCode(prize: string): string {
  if (prize === "Free Shipping") return "FREESHIP";
  if (prize === "Free Bookmark") return "BOOKMARK";
  const n = prize.replace(/[^0-9]/g, "");
  return `LUCKY${n}`;
}

export default function LuckyDrawSpinner() {
  const [isOpen, setIsOpen]           = useState(false);
  const [isSpinning, setIsSpinning]   = useState(false);
  const [rotation, setRotation]       = useState(0);
  const [result, setResult]           = useState<string | null>(null);
  const [hasSpun, setHasSpun]         = useState(false);
  const [showInitial, setShowInitial] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [timeLeft, setTimeLeft]       = useState(3600);
  const [confetti, setConfetti]       = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [socialCount]  = useState(() => Math.floor(Math.random() * 60) + 85);
  const [canvasSize, setCanvasSize]   = useState(260);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  /* ── Responsive canvas ── */
  useEffect(() => {
    const update = () => setCanvasSize(window.innerWidth < 400 ? 220 : 260);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── First-visit trigger ── */
  useEffect(() => {
    const shown = sessionStorage.getItem(SPINNER_SHOWN_KEY);
    if (!shown) {
      const t = setTimeout(() => {
        setShowInitial(true);
        setIsOpen(true);
        sessionStorage.setItem(SPINNER_SHOWN_KEY, "1");
      }, 2000);
      return () => clearTimeout(t);
    } else {
      setIsMinimized(true);
    }
  }, []);

  /* ── Urgency countdown after win ── */
  useEffect(() => {
    if (!result || result === "Try Again") return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [result]);

  /* ── Cleanup animation frame on unmount ── */
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map(v => v.toString().padStart(2, "0"))
      .join(":");

  /* ── Canvas wheel draw ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size   = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    // Outer glow halo
    const halo = ctx.createRadialGradient(center, center, radius - 4, center, center, radius + 14);
    halo.addColorStop(0, "rgba(168,85,247,0.45)");
    halo.addColorStop(1, "rgba(168,85,247,0)");
    ctx.beginPath();
    ctx.arc(center, center, radius + 14, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    PRIZES.forEach((prize, i) => {
      const startA = (i * SEGMENT_ANGLE * Math.PI) / 180;
      const endA   = ((i + 1) * SEGMENT_ANGLE * Math.PI) / 180;
      const midA   = startA + (endA - startA) / 2;

      const grad = ctx.createLinearGradient(
        Math.cos(midA) * radius * 0.15, Math.sin(midA) * radius * 0.15,
        Math.cos(midA) * radius,        Math.sin(midA) * radius,
      );
      grad.addColorStop(0, prize.grad[0]);
      grad.addColorStop(1, prize.grad[1]);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startA + (SEGMENT_ANGLE * Math.PI) / 360);
      ctx.textAlign   = "right";
      ctx.fillStyle   = prize.text;
      ctx.font        = `bold ${size < 240 ? 10 : 12}px Inter, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur  = 3;
      ctx.fillText(prize.label, radius - 12, 5);
      ctx.restore();
    });

    ctx.restore();

    // Center hub
    const hub = ctx.createRadialGradient(center - 5, center - 5, 2, center, center, 26);
    hub.addColorStop(0, "#9333ea");
    hub.addColorStop(1, "#1e1b4b");
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, Math.PI * 2);
    ctx.fillStyle = hub;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 3;
    ctx.stroke();
    ctx.fillStyle      = "#fff";
    ctx.textAlign      = "center";
    ctx.textBaseline   = "middle";
    ctx.font           = "bold 15px sans-serif";
    ctx.shadowBlur     = 0;
    ctx.fillText("★", center, center);
  }, [rotation, isOpen, canvasSize]);

  /* ── Confetti burst ── */
  const spawnConfetti = useCallback(() => {
    const colors = ["#FF6B6B","#4ECDC4","#F9CA24","#a29bfe","#fd79a8","#55efc4","#FF8E53"];
    setConfetti(
      Array.from({ length: 90 }, (_, id) => ({
        id,
        style: {
          position: "absolute" as const,
          left:  `${Math.random() * 100}%`,
          top:   "-12px",
          width:  `${Math.random() * 9 + 4}px`,
          height: `${Math.random() * 9 + 4}px`,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animation: `ld-fall ${(Math.random() * 1.6 + 0.9).toFixed(2)}s ease-in ${(Math.random() * 0.6).toFixed(2)}s forwards`,
        },
      })),
    );
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3200);
  }, []);

  /* ── Spin logic ── */
  const spin = useCallback(() => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);
    setResult(null);

    const idx        = Math.floor(Math.random() * PRIZES.length);
    const extraSpins = 5 * 360 + Math.random() * 180;
    const prizeAngle = idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const target     = extraSpins + (360 - prizeAngle);
    const startRot   = rotation;
    const duration   = 5200;
    let   start: number | null = null;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const p     = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // ease-out quartic → dramatic slowdown
      setRotation(startRot + target * eased);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setRotation((startRot + target) % 360);
        setIsSpinning(false);
        setHasSpun(true);
        const won = PRIZES[idx].label;
        setResult(won);
        if (won !== "Try Again") setTimeout(spawnConfetti, 250);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [isSpinning, hasSpun, rotation, spawnConfetti]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(getCouponCode(result)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const closeModal = () => { setIsOpen(false); setShowInitial(false); setIsMinimized(true); };
  const openModal  = () => { setIsOpen(true);  setIsMinimized(false); };

  const couponCode = result && result !== "Try Again" ? getCouponCode(result) : null;

  return (
    <>
      {/* ── Scoped keyframes ── */}
      <style>{`
        @keyframes ld-fall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(640px) rotate(540deg); opacity: 0; }
        }
        @keyframes ld-scale-in {
          from { opacity: 0; transform: scale(0.55) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes ld-slide-up {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ld-glow {
          0%,100% { box-shadow: 0 0 14px rgba(168,85,247,.55), 0 4px 22px rgba(168,85,247,.3); }
          50%     { box-shadow: 0 0 36px rgba(168,85,247,.95), 0 4px 44px rgba(236,72,153,.6); }
        }
        @keyframes ld-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-7px); }
        }
        @keyframes ld-urgent {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.05); }
        }
        @keyframes ld-ring-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ld-shine {
          0%   { transform: translateX(-110%) skewX(-20deg); }
          100% { transform: translateX(420%)  skewX(-20deg); }
        }
        .ld-scale-in  { animation: ld-scale-in 0.45s cubic-bezier(.34,1.56,.64,1) both; }
        .ld-slide-up  { animation: ld-slide-up 0.35s ease-out both; }
        .ld-glow-btn  { animation: ld-glow 2.4s ease-in-out infinite; }
        .ld-float     { animation: ld-float 3s ease-in-out infinite; }
        .ld-urgent    { animation: ld-urgent 0.9s ease-in-out infinite; }
        .ld-shine     { animation: ld-shine 2.8s ease-in-out infinite; }
      `}</style>

      {/* ── Floating trigger ── */}
      {isMinimized && !isOpen && (
        <div className="fixed bottom-6 left-6 z-[100] group">
          <button
            onClick={openModal}
            aria-label="Open Lucky Draw Spinner"
            className="relative w-16 h-16 rounded-full
              bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500
              ld-glow-btn ld-float
              hover:scale-110 active:scale-95 transition-transform duration-300
              flex items-center justify-center"
          >
            <Gift className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-black">!</span>
              </span>
            </span>
          </button>
          {/* Tooltip on hover */}
          <div className="pointer-events-none absolute left-[72px] bottom-3
            bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl
            opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            🎁 Spin &amp; Win a prize!
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}

      {/* ── Full modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Card — sheet on mobile, centered card on sm+ */}
          <div className={`relative z-10 w-full sm:max-w-sm
            bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden
            ${showInitial ? "ld-scale-in" : "ld-slide-up"}`}>

            {/* Confetti layer */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                {confetti.map(c => <div key={c.id} style={c.style} />)}
              </div>
            )}

            {/* ── Header gradient ── */}
            <div className="relative bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-600 px-5 py-4 overflow-hidden">
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />

              <button
                onClick={closeModal}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20
                  hover:bg-white/35 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="text-center relative">
                <div className="text-4xl leading-none mb-1">🎰</div>
                <h2 className="text-2xl font-black text-white tracking-tight">LUCKY SPIN!</h2>
                <p className="text-purple-100 text-sm mt-0.5">
                  {hasSpun ? "Claim your exclusive reward below!" : "One free spin — instant prize!"}
                </p>
              </div>

              {/* Social-proof strip */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex -space-x-1.5">
                  {["🧑","👩","👨","🧑‍🦰"].map((e, i) => (
                    <span key={i} className="w-6 h-6 rounded-full bg-white/20 border border-white/40
                      flex items-center justify-center text-xs">{e}</span>
                  ))}
                </div>
                <span className="text-purple-100 text-xs">
                  <span className="text-yellow-300 font-bold">{socialCount}</span> people won today!
                </span>
                <span className="bg-yellow-400/20 border border-yellow-300/50 text-yellow-300
                  text-[10px] px-1.5 py-0.5 rounded-full font-bold tracking-wide">● LIVE</span>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-4 pt-3 pb-5">

              {/* Wheel area */}
              <div className="flex justify-center items-center relative my-1">
                {/* Rotating dashed ring decoration */}
                <div
                  className="absolute rounded-full border-[3px] border-dashed border-purple-200/70"
                  style={{
                    width:  canvasSize + 30,
                    height: canvasSize + 30,
                    animation: isSpinning ? "ld-ring-spin 5s linear infinite" : "none",
                  }}
                />

                <div className="relative inline-block">
                  {/* Fixed pointer ▼ */}
                  <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 z-10"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}>
                    <div className="w-0 h-0
                      border-l-[10px] border-l-transparent
                      border-r-[10px] border-r-transparent
                      border-t-[22px] border-t-purple-700" />
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={canvasSize}
                    height={canvasSize}
                    className="block rounded-full"
                    style={{ filter: isSpinning ? "drop-shadow(0 0 18px rgba(168,85,247,0.6))" : "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}
                  />
                </div>
              </div>

              {/* ── Post-spin result ── */}
              {result ? (
                <div className="ld-scale-in mt-2">
                  {result === "Try Again" ? (
                    /* ── No win ── */
                    <div className="text-center py-2">
                      <p className="text-5xl mb-2">😢</p>
                      <p className="font-bold text-gray-700 text-lg">Almost! Better luck next time.</p>
                      <p className="text-gray-500 text-sm mt-1">Explore our deals — great books at every price!</p>
                      <a href="/shop"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-2xl
                          bg-gradient-to-r from-purple-500 to-pink-500
                          text-white font-bold hover:shadow-lg active:scale-[0.98] transition-all duration-200">
                        <ShoppingBag className="w-4 h-4" /> Browse All Deals
                      </a>
                    </div>
                  ) : (
                    /* ── Win ── */
                    <div>
                      {/* Prize card */}
                      <div className="relative bg-gradient-to-br from-purple-50 via-white to-pink-50
                        border-2 border-purple-200 rounded-2xl p-4 overflow-hidden">
                        <div className="absolute -top-5 -right-5 w-16 h-16 bg-purple-100 rounded-full opacity-40" />

                        <div className="text-center relative">
                          <span className="inline-block text-xs font-bold text-purple-500 uppercase tracking-widest
                            bg-purple-100 px-2.5 py-0.5 rounded-full">🎉 You Won!</span>
                          <p className="text-3xl font-black mt-1.5
                            bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {result}
                          </p>
                        </div>

                        {/* Coupon row */}
                        <div className="mt-3 flex gap-2">
                          <div className="flex-1 bg-white border-2 border-dashed border-purple-300
                            rounded-xl px-3 py-2.5 flex items-center justify-center min-w-0">
                            <span className="font-mono font-bold text-purple-700 text-sm sm:text-base tracking-widest truncate">
                              {couponCode}
                            </span>
                          </div>
                          <button
                            onClick={handleCopy}
                            className={`shrink-0 px-3 py-2.5 rounded-xl font-bold text-sm
                              flex items-center gap-1.5 transition-all duration-200
                              ${copied
                                ? "bg-emerald-500 text-white scale-95"
                                : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                              }`}
                          >
                            {copied
                              ? <><Check className="w-4 h-4" />Done!</>
                              : <><Copy className="w-4 h-4" />Copy</>
                            }
                          </button>
                        </div>

                        {/* Urgency timer */}
                        <div className="mt-3 ld-urgent flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="font-bold text-red-600 text-sm tabular-nums">
                            Expires in {fmt(timeLeft)}
                          </span>
                        </div>
                        <p className="text-center text-[11px] text-gray-400 mt-0.5">
                          ⚡ Offer vanishes when the timer hits zero!
                        </p>
                      </div>

                      {/* Primary CTA */}
                      <a href="/shop"
                        className="mt-3 relative flex items-center justify-center gap-2
                          w-full py-4 rounded-2xl overflow-hidden
                          bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600
                          text-white font-black text-base sm:text-lg
                          hover:shadow-2xl hover:shadow-purple-500/40
                          active:scale-[0.98] transition-all duration-300 group">
                        {/* Shine sweep on hover */}
                        <div className="absolute top-0 bottom-0 w-16 bg-white/25 blur-sm
                          opacity-0 group-hover:opacity-100 ld-shine" />
                        <ShoppingBag className="w-5 h-5 shrink-0" />
                        <span>USE MY {result} NOW!</span>
                        <Zap className="w-4 h-4 shrink-0" />
                      </a>

                      <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        Code auto-applies at checkout
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Pre-spin ── */
                <div>
                  <button
                    onClick={spin}
                    disabled={isSpinning}
                    className={`relative w-full py-4 rounded-2xl font-black text-lg sm:text-xl
                      text-white overflow-hidden transition-all duration-300
                      ${isSpinning
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:shadow-2xl hover:shadow-purple-500/40 active:scale-[0.98]"
                      }`}
                  >
                    {!isSpinning && (
                      <div className="absolute top-0 bottom-0 w-16 bg-white/25 blur-sm ld-shine" />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {isSpinning
                        ? <><span className="inline-block animate-spin">🎰</span> Spinning…</>
                        : "🎰  SPIN TO WIN!  🎰"
                      }
                    </span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    One free spin per visit · No purchase required · Instant results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
