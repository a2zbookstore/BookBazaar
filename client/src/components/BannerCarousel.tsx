import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export interface BannerItem {
  id: string | number;
  image: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

interface BannerCarouselProps {
  pageName: string;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showNavigation?: boolean;
  height?: string;
  className?: string;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  pageName,
  autoPlayInterval = 5000,
  showIndicators = true,
  showNavigation = true,
  height = "h-56 sm:h-72 md:h-96",
  className = "",
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: false, containScroll: "trimSnaps" },
    autoPlayInterval > 0 ? [Autoplay({ delay: autoPlayInterval, stopOnInteraction: false })] : []
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const items: BannerItem[] = data[0].image_urls.map((img: string, idx: number) => ({
            id: `${data[0].id}_${idx}`,
            image: img,
            alt: data[0].page_type,
          }));
          setBanners(items);
        } else {
          setBanners([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setBanners([]);
        setIsLoading(false);
      });
  }, [pageName]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  /* ── Skeleton ── */
  if (isLoading) {
    return (
      <div className={`relative ${height} overflow-hidden rounded-2xl ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
        {/* shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.6s_infinite] -skew-x-12" />
        <style>{`@keyframes shimmer{0%{transform:translateX(-100%) skewX(-12deg)}100%{transform:translateX(200%) skewX(-12deg)}}`}</style>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div
      className={`relative ${height} overflow-hidden rounded-2xl shadow-xl group ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ── Slides ── */}
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {banners.map((banner, index) => (
            <div key={banner.id} className="embla__slide flex-[0_0_100%] relative h-full">
              <img
                src={banner.image}
                alt={banner.alt || banner.title || "Banner"}
                className="w-full h-full object-cover object-center block select-none"
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />

              {/* Overlay — only when text/button present */}
              {(banner.title || banner.subtitle || banner.buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
                    <div className="max-w-xl">
                      {banner.title && (
                        <h2 className="text-white text-xl sm:text-3xl md:text-5xl font-extrabold leading-tight mb-1 md:mb-2 drop-shadow-lg line-clamp-2">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="text-white/85 text-sm sm:text-base md:text-xl mb-3 md:mb-5 line-clamp-2 font-medium drop-shadow">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.buttonText && (
                        <Link href={banner.link || "#"}>
                          <button className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 text-sm md:text-base px-5 py-2.5 md:px-7 md:py-3 rounded-full font-semibold shadow-lg transition-all duration-200">
                            {banner.buttonText}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      {showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className={`absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 md:w-11 md:h-11 rounded-full
              bg-white/20 backdrop-blur-md border border-white/30
              flex items-center justify-center
              text-white shadow-lg
              hover:bg-white/35 active:scale-90
              transition-all duration-200
              ${hovering ? "opacity-100" : "opacity-0 md:opacity-0"}
              group-hover:opacity-100`}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
          </button>

          <button
            onClick={scrollNext}
            className={`absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-10
              w-9 h-9 md:w-11 md:h-11 rounded-full
              bg-white/20 backdrop-blur-md border border-white/30
              flex items-center justify-center
              text-white shadow-lg
              hover:bg-white/35 active:scale-90
              transition-all duration-200
              ${hovering ? "opacity-100" : "opacity-0 md:opacity-0"}
              group-hover:opacity-100`}
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* ── Pill indicators ── */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to banner ${index + 1}`}
              className={`rounded-full transition-all duration-300 ease-out
                ${index === selectedIndex
                  ? "bg-white w-6 md:w-8 h-2 shadow-md"
                  : "bg-white/45 hover:bg-white/70 w-2 h-2"
                }`}
            />
          ))}
        </div>
      )}

      {/* ── Slide counter badge (top-right) ── */}
      {banners.length > 1 && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold tabular-nums select-none">
          {selectedIndex + 1} / {banners.length}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;