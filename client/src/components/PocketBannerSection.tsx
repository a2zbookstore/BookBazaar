import React, { useEffect, useState } from "react";
import { Link } from "wouter";

interface BannerItem {
  id: string | number;
  image: string;
  alt?: string;
  clickUrl?: string;
}

interface PocketBannerSectionProps {
  pageName: string;
  fallbackPageNames?: string[];
  /** Category display name shown in the placeholder tiles */
  categoryName?: string;
  /** Show placeholder tiles when no real banners are uploaded (default true) */
  showPlaceholder?: boolean;
}

/* Muted palette cycles so each category gets a different colour */
const PLACEHOLDER_COLORS = [
  { bg: "bg-amber-100",   text: "text-amber-800"   },
  { bg: "bg-sky-100",     text: "text-sky-800"     },
  { bg: "bg-emerald-100", text: "text-emerald-800" },
  { bg: "bg-violet-100",  text: "text-violet-800"  },
  { bg: "bg-rose-100",    text: "text-rose-800"    },
  { bg: "bg-orange-100",  text: "text-orange-800"  },
];

function hashIndex(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % PLACEHOLDER_COLORS.length;
}

const PLACEHOLDER_LABELS = ["Special Offer", "New Arrivals", "Bestsellers"];

const PocketBannerSection: React.FC<PocketBannerSectionProps> = ({
  pageName,
  fallbackPageNames = [],
  categoryName = "",
  showPlaceholder = true,
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const namesToTry = [pageName, ...fallbackPageNames];
    setLoading(true);

    const tryNext = async () => {
      for (const name of namesToTry) {
        try {
          // Try new promo-banners API first (individual records)
          const res = await fetch(
            `/api/promo-banners?group=${encodeURIComponent(name)}`
          );
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data) && data.length > 0) {
            const items: BannerItem[] = data.slice(0, 4).map((row: any) => ({
              id: row.id,
              image: row.image_url,
              alt: row.title,
              clickUrl: row.link_url || undefined,
            }));
            setBanners(items);
            setLoading(false);
            return;
          }
        } catch {
          // try next name
        }
      }
      if (!cancelled) { setBanners([]); setLoading(false); }
    };

    tryNext();
    return () => { cancelled = true; };
  }, [pageName]);

  /* ── Shared scroll/grid wrapper ── */
  const wrapperClass = `
    flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
    sm:grid sm:grid-cols-3 sm:overflow-visible sm:snap-none
    md:gap-4
  `;

  const tileClass = `
    flex-none w-[82vw] snap-start
    sm:w-auto sm:flex-auto
    h-32 sm:h-36 md:h-44
  `;

  /* ── Shared title shown above the strip when categoryName is provided ── */
  const title = categoryName ? (
    <div className="flex items-center gap-2 mb-3">
      <span className="shrink-0 w-1 h-5 rounded-full bg-primary-aqua" />
      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-600">
        {categoryName} — Offers &amp; Highlights
      </h4>
    </div>
  ) : null;

  /* ── Real banners ── */
  if (!loading && banners.length > 0) {
    return (
      <>
        {title}
        <div className={wrapperClass}>
          {banners.map((banner) => {
            const image = (
              <img
                src={banner.image}
                alt={banner.alt || "Banner"}
                className="w-full h-full object-cover object-center select-none transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
                draggable={false}
              />
            );
            return (
              <div key={banner.id} className={tileClass}>
                <div className="relative overflow-hidden rounded-2xl shadow-md group h-full">
                  {banner.clickUrl ? (
                    <Link href={banner.clickUrl} className="block w-full h-full">
                      {image}
                    </Link>
                  ) : image}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  /* ── Placeholders ── */
  if (!loading && showPlaceholder) {
    const colorBase = hashIndex(pageName);
    return (
      <>
        {title}
        <div className={wrapperClass}>
          {PLACEHOLDER_LABELS.map((label, i) => {
            const { bg, text } = PLACEHOLDER_COLORS[(colorBase + i) % PLACEHOLDER_COLORS.length];
            return (
              <div key={i} className={tileClass}>
                <div className={`relative overflow-hidden rounded-2xl shadow-sm h-full ${bg} flex flex-col items-center justify-center gap-1 px-4`}>
                  {categoryName && (
                    <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 ${text}`}>
                      {categoryName}
                    </p>
                  )}
                  <p className={`text-base sm:text-lg font-bold text-center ${text}`}>
                    {label}
                  </p>
                  <p className={`text-[10px] opacity-50 ${text}`}>
                    Upload via Admin → Banners → <code className="font-mono">{pageName}</code>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return null;
};

export default PocketBannerSection;

