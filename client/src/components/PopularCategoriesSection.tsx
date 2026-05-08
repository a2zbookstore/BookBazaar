import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Category } from "@/types";

// ─── rich palette: gradient + blob colours + glow ────────────────────────
const PALETTES = [
  {
    gradient: "from-amber-300 via-orange-200 to-yellow-100",
    blob1: "bg-amber-400/30",
    blob2: "bg-orange-300/25",
    glow: "rgba(251,191,36,0.35)",
    text: "text-amber-900",
  },
  {
    gradient: "from-sky-300 via-blue-200 to-cyan-100",
    blob1: "bg-sky-400/30",
    blob2: "bg-blue-300/25",
    glow: "rgba(56,189,248,0.35)",
    text: "text-sky-900",
  },
  {
    gradient: "from-rose-300 via-pink-200 to-red-100",
    blob1: "bg-rose-400/30",
    blob2: "bg-pink-300/25",
    glow: "rgba(251,113,133,0.35)",
    text: "text-rose-900",
  },
  {
    gradient: "from-emerald-300 via-green-200 to-teal-100",
    blob1: "bg-emerald-400/30",
    blob2: "bg-green-300/25",
    glow: "rgba(52,211,153,0.35)",
    text: "text-emerald-900",
  },
  {
    gradient: "from-violet-300 via-purple-200 to-indigo-100",
    blob1: "bg-violet-400/30",
    blob2: "bg-purple-300/25",
    glow: "rgba(167,139,250,0.35)",
    text: "text-violet-900",
  },
  {
    gradient: "from-fuchsia-300 via-pink-200 to-rose-100",
    blob1: "bg-fuchsia-400/30",
    blob2: "bg-pink-300/25",
    glow: "rgba(232,121,249,0.35)",
    text: "text-fuchsia-900",
  },
];

// ─── individual card with scroll-triggered entrance + hover animations ────
function CategoryCard({
  category,
  index,
  className = "",
  animDelay = 0,
}: {
  category: Category;
  index: number;
  className?: string;
  animDelay?: number;
}) {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const palette = PALETTES[index % PALETTES.length];

  // Trigger entrance animation when card scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link href={`/catalog?categoryId=${category.id}`}>
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl cursor-pointer group bg-gradient-to-br ${palette.gradient} ${className}`}
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
          transition: `opacity 0.65s ease-out ${animDelay}ms, transform 0.65s ease-out ${animDelay}ms`,
          boxShadow: hovered
            ? `0 20px 48px -10px ${palette.glow}, 0 8px 20px -6px rgba(0,0,0,0.12)`
            : "0 2px 8px -2px rgba(0,0,0,0.08)",
          transitionProperty: hovered ? "box-shadow" : undefined,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── decorative blobs (animate on hover) ── */}
        <div
          className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl ${palette.blob1}`}
          style={{
            transform: hovered ? "scale(1.4) translate(4px,-4px)" : "scale(1)",
            transition: "transform 0.7s ease-out",
          }}
        />
        <div
          className={`absolute -bottom-12 -left-12 w-44 h-44 rounded-full blur-2xl ${palette.blob2}`}
          style={{
            transform: hovered ? "scale(1.3) translate(-4px,4px)" : "scale(1)",
            transition: "transform 0.7s ease-out 0.05s",
          }}
        />

        {/* ── shine sweep on hover ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
            transform: hovered ? "translateX(100%)" : "translateX(-100%)",
            transition: hovered ? "transform 0.55s ease-in-out" : "none",
          }}
        />

        {/* ── hover scale wrapper ── */}
        <div
          className="relative w-full h-full flex flex-col justify-end p-4"
          style={{
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {/* ── label ── */}
          <div
            className="self-start bg-white/85 backdrop-blur-md rounded-xl px-4 py-2 shadow"
            style={{
              transform: hovered ? "translateY(-4px)" : "translateY(0)",
              transition: "transform 0.35s ease-out",
            }}
          >
            <span className={`text-sm md:text-base font-bold ${palette.text} tracking-wide`}>
              {category.name}
            </span>
          </div>
        </div>

        {/* ── border glow ring on hover ── */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: hovered ? `inset 0 0 0 2px ${palette.glow}` : "inset 0 0 0 1px rgba(255,255,255,0.3)",
            transition: "box-shadow 0.3s ease",
          }}
        />
      </div>
    </Link>
  );
}

// ─── main section ─────────────────────────────────────────────────────────
interface PopularCategoriesSectionProps {
  categories: Category[];
}

export default function PopularCategoriesSection({
  categories,
}: PopularCategoriesSectionProps) {
  if (categories.length === 0) return null;

  // Show up to 6 in the bento grid
  const shown = categories.slice(0, 6);
  const left = shown.slice(0, 3);   // [0] large | [1],[2] small row
  const right = shown.slice(3, 6);  // [3],[4] small row | [5] large

  // Stagger delays across the 6 cards (in layout order)
  const delays = [0, 80, 140, 60, 120, 200];

  return (
    <section className="w-full mb-12">
      {/* ── heading ── */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Popular Categories
      </h2>

      {/*
        Bento layout:
        LEFT                              RIGHT
        ┌──────────────────────┐          ┌───────────┬───────────┐
        │  [0]  LARGE          │          │  [3] sm   │  [4] sm   │
        │                      │          ├───────────┴───────────┤
        ├───────────┬──────────┤          │  [5]  LARGE           │
        │  [1] sm   │  [2] sm  │          │                       │
        └───────────┴──────────┘          └───────────────────────┘
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── LEFT ── */}
        <div className="grid grid-rows-[minmax(220px,2fr)_minmax(150px,1fr)] gap-4">
          {left[0] && (
            <CategoryCard
              category={left[0]}
              index={0}
              animDelay={delays[0]}
              className="h-full min-h-[220px]"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            {left[1] && (
              <CategoryCard
                category={left[1]}
                index={1}
                animDelay={delays[1]}
                className="min-h-[150px]"
              />
            )}
            {left[2] && (
              <CategoryCard
                category={left[2]}
                index={2}
                animDelay={delays[2]}
                className="min-h-[150px]"
              />
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="grid grid-rows-[minmax(150px,1fr)_minmax(220px,2fr)] gap-4">
          <div className="grid grid-cols-2 gap-4">
            {right[0] && (
              <CategoryCard
                category={right[0]}
                index={3}
                animDelay={delays[3]}
                className="min-h-[150px]"
              />
            )}
            {right[1] && (
              <CategoryCard
                category={right[1]}
                index={4}
                animDelay={delays[4]}
                className="min-h-[150px]"
              />
            )}
          </div>
          {right[2] && (
            <CategoryCard
              category={right[2]}
              index={5}
              animDelay={delays[5]}
              className="h-full min-h-[220px]"
            />
          )}
        </div>
      </div>

      {/* browse all */}
      {categories.length > 6 && (
        <div className="mt-4 text-center">
          <Link href="/catalog">
            <span className="text-sm font-medium text-primary-aqua hover:underline cursor-pointer">
              Browse all categories →
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
