import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import BannerCarousel, { BannerItem } from "@/components/BannerCarousel";

interface HeroBannerGridProps {
  /** page_type for the large carousel on the left */
  mainPageName?: string;
  /** Optional fallbacks for the large carousel */
  mainFallbackPageNames?: string[];
  /** page_type for the 2 wide banners stacked on the right */
  sidePageName?: string;
  /** page_type for the 3 wide banners in a row below */
  stripPageName?: string;
}

/* ── Single banner tile ── */
const BannerTile: React.FC<{ banner: BannerItem }> = ({ banner }) => {
  const image = (
    <img
      src={banner.image}
      alt={banner.alt || banner.title || "Banner"}
      className="w-full h-full object-cover object-center select-none transition-transform duration-500 ease-out group-hover:scale-105"
      loading="lazy"
      draggable={false}
    />
  );

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg group h-full">
      {banner.clickUrl ? (
        <Link href={banner.clickUrl} className="block w-full h-full">
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
};

/* ── Fetch helper for a banner page_type ── */
function useBanners(pageName: string, limit: number) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/promo-banners?group=${encodeURIComponent(pageName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const items: BannerItem[] = data
            .slice(0, limit)
            .map((row: any) => ({
              id: row.id,
              image: row.image_url,
              alt: row.title,
              clickUrl: row.link_url || undefined,
            }));
          setBanners(items);
        } else {
          setBanners([]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setBanners([]); setLoading(false); }
      });

    return () => {
      cancelled = true;
    };
  }, [pageName, limit]);

  return { banners, loading };
}

const HeroBannerGrid: React.FC<HeroBannerGridProps> = ({
  mainPageName = "home",
  mainFallbackPageNames = [],
  sidePageName = "home_side",
  stripPageName = "home_strip",
}) => {
  const { banners: sideBanners, loading: sideLoading } = useBanners(sidePageName, 2);
  const { banners: stripBanners, loading: stripLoading } = useBanners(stripPageName, 3);

  const hasSide = sideBanners.length > 0;
  const hasStrip = stripBanners.length > 0;
  const showRow2 = sideLoading || stripLoading || hasSide || hasStrip;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* ── Row 1: big banner + 2 stacked side banners ── */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
        {/* Large banner — full-width on mobile, flex-[3] on desktop */}
        <div className={`${hasSide || sideLoading ? "lg:flex-[4]" : "lg:flex-1"} min-w-0`}>
          <BannerCarousel
            pageName={mainPageName}
            fallbackPageNames={mainFallbackPageNames}
            autoPlayInterval={5000}
            showIndicators={true}
            showNavigation={true}
            height="h-72 sm:h-96 lg:h-[32rem]"
            className="rounded-2xl h-full"
          />
        </div>

        {/* 2 stacked wide banners — desktop only, hidden entirely when none */}
        {(sideLoading || hasSide) && (
          <div className="hidden lg:grid lg:flex-[2] min-w-0 grid-rows-2 gap-4 lg:h-[32rem]">
            {sideLoading
              ? [0, 1].map(i => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse" />)
              : sideBanners.map((banner) => <BannerTile key={banner.id} banner={banner} />)
            }
          </div>
        )}
      </div>

      {/* ── Row 2 ── */}
      {/* Mobile: horizontal scroll with side banners + strip banners combined    */}
      {/*   — 1st tile ~full-width, 2nd half-peeks to hint at scrollability       */}
      {/* Desktop (lg+): 3-column grid showing only the strip banners             */}
      {showRow2 && (stripLoading ? (
        /* Skeleton — matches the 3-col strip grid exactly */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-36 md:h-44 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (hasSide || hasStrip) && (
      <div className="
        flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none
        md:gap-4
      ">
        {/* Side tiles visible only on mobile scroll */}
        {sideBanners.map((banner) => (
          <div
            key={`m-${banner.id}`}
            className="flex-none w-[82vw] snap-start h-36 lg:hidden"
          >
            <BannerTile banner={banner} />
          </div>
        ))}

        {/* Strip tiles — scroll on mobile, grid on desktop */}
        {stripBanners.map((banner) => (
          <div
            key={banner.id}
            className="
              flex-none w-[82vw] snap-start
              lg:w-auto lg:flex-auto
              h-36 md:h-44
            "
          >
            <BannerTile banner={banner} />
          </div>
        ))}
      </div>
      ))}
    </div>
  );
};

export default HeroBannerGrid;
