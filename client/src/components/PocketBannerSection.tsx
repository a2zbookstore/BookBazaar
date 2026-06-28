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
  /** Category display name used as fallback heading */
  categoryName?: string;
}


const PocketBannerSection: React.FC<PocketBannerSectionProps> = ({
  pageName,
  fallbackPageNames = [],
  categoryName = "",
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [dbTitle, setDbTitle] = useState<string>("");
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
            // Extract base title from first banner — strip trailing " — N" suffix
            const rawTitle: string = data[0].title || "";
            const baseTitle = rawTitle.replace(/\s*\u2014\s*\d+$/, "").trim();
            setDbTitle(baseTitle);
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

  /* ── Heading: use DB title if available, else fall back to categoryName preset ── */
  const headingText = dbTitle || (categoryName ? `${categoryName} — Offers & Highlights` : "");
  const title = headingText ? (
    <div className="flex items-center gap-2 mb-3">
      <span className="shrink-0 w-1 h-5 rounded-full bg-primary-aqua" />
      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-600">
        {headingText}
      </h4>
    </div>
  ) : null;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="h-3 w-40 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-32 sm:h-36 md:h-44 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Real banners ── */
  if (banners.length > 0) {
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

  return null;
};

export default PocketBannerSection;

