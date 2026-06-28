import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SmallBannerStripProps {
  pageName: string;
  className?: string;
  autoPlayInterval?: number;
}

interface BannerData {
  image_urls: string[];
  link_urls?: string[];
}

const SmallBannerStrip: React.FC<SmallBannerStripProps> = ({
  pageName,
  className = "",
  autoPlayInterval = 4000,
}) => {
  const [banners, setBanners] = useState<{ imageUrl: string; linkUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data: BannerData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const items = data[0].image_urls
            .filter(Boolean)
            .map((img, idx) => ({
              imageUrl: img,
              linkUrl: data[0].link_urls?.[idx] || undefined,
            }));
          setBanners(items);
        } else {
          setBanners([]);
        }
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, [pageName]);

  const goTo = useCallback((idx: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 400);
  }, [animating]);

  const next = useCallback(() => {
    goTo((current + 1) % banners.length, "left");
  }, [current, banners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length, "right");
  }, [current, banners.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, next, autoPlayInterval]);

  if (loading || banners.length === 0) return null;

  const slideInClass = animating
    ? direction === "left"
      ? "animate-slide-in-left"
      : "animate-slide-in-right"
    : "";

  const banner = banners[current];
  const imgEl = (
    <img
      src={banner.imageUrl}
      alt={`Promotional banner ${current + 1}`}
      className="w-full h-24 sm:h-28 md:h-32 object-cover block"
      draggable={false}
    />
  );

  return (
    <>
      <style>{`
        @keyframes slideInFromLeft {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(-60px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .animate-slide-in-left  { animation: slideInFromLeft  0.4s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .animate-slide-in-right { animation: slideInFromRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      `}</style>

      <div className={`flex justify-center mb-6 ${className}`}>
        <div className="relative w-1/2 overflow-hidden rounded-lg group">
          {/* Animated slide */}
          <div key={current} className={slideInClass}>
            {banner.linkUrl ? (
              <Link href={banner.linkUrl} className="block">{imgEl}</Link>
            ) : (
              imgEl
            )}
          </div>

          {/* Prev / Next arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i, i > current ? "left" : "right")}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
                    aria-label={`Go to banner ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SmallBannerStrip;
