import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

// Module-level flag: resets on every full page refresh
let _swipeHintDone = false;

interface BookCarouselProps {
    books: Book[];
    bgGradient?: string;
    emptyMessage?: string;
    showEmptyBrowseButton?: boolean;
    isLoading?: boolean;
    currentSlide?: number;
    onSlideChange?: (slide: number) => void;
}

const BookCarousel: React.FC<BookCarouselProps> = ({
    books,
    emptyMessage = "No books available at the moment.",
    showEmptyBrowseButton = true,
    isLoading = false,
    currentSlide: externalSlide,
    onSlideChange,
}) => {
    const CARD_WIDTH_REM = 14; // w-56 = 14rem
    const GAP_REM = 1;        // gap-4 = 1rem
    const STEP = CARD_WIDTH_REM + GAP_REM;
    // Calculate visible cards based on screen size - ensure it's never negative
    const VISIBLE_CARDS = window.innerWidth >= 768
        ? Math.floor((window.innerWidth - 64) / (CARD_WIDTH_REM * 16 + GAP_REM * 16))
        : 2; // Always show 2 cards on mobile for skeleton
    const [internalSlide, setInternalSlide] = useState(0);
    const isControlled = externalSlide !== undefined && onSlideChange !== undefined;
    const currentSlide = isControlled ? externalSlide : internalSlide;
    const setCurrentSlide = isControlled ? onSlideChange : setInternalSlide;
    const maxSlide = Math.max(0, books.length - VISIBLE_CARDS);

    // Swipe hint: show once per page load (module-level flag resets on refresh)
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    useEffect(() => {
        if (!_swipeHintDone) {
            _swipeHintDone = true;
            const t = setTimeout(() => setShowSwipeHint(true), 700);
            return () => clearTimeout(t);
        }
    }, []);
    useEffect(() => {
        if (showSwipeHint) {
            const t = setTimeout(() => setShowSwipeHint(false), 2400);
            return () => clearTimeout(t);
        }
    }, [showSwipeHint]);

    const handlePrevious = () => {
        setCurrentSlide(Math.max(currentSlide - 1, 0));
    };

    const handleNext = () => {
        setCurrentSlide(Math.min(currentSlide + 1, maxSlide));
    };

    // Loading skeleton component
    if (isLoading) {
        return (
            <div className="animate-pulse">
                {/* Mobile skeleton */}
                {/* Mobile skeleton (updated to match BookCard) */}
                <div className="md:hidden w-[90vw] overflow-x-auto pb-4 pl-4 pr-2">
                    <div className="flex gap-4 w-max animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-none w-[170px] rounded-xl bg-white shadow-sm border"
                            >
                                {/* Book image */}
                                <div className="aspect-[3/4] bg-gray-300 rounded-t-xl" />

                                {/* Content */}
                                <div className="p-2 space-y-2">
                                    {/* Title */}
                                    <div className="h-3 bg-gray-300 rounded w-5/6" />

                                    {/* Author */}
                                    <div className="h-2 bg-gray-300 rounded w-2/3" />

                                    {/* Price / rating row */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="h-3 bg-gray-300 rounded w-1/3" />
                                        <div className="h-2 bg-gray-300 rounded w-1/4" />
                                    </div>

                                    {/* CTA button */}
                                    <div className="h-6 bg-gray-300 rounded-lg mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex-none w-56 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
                                <div className="h-[260px] bg-gray-200 w-full" />
                                <div className="px-3 pt-2 pb-3 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full" />
                                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                                    <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                                    <div className="flex gap-2 pt-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                                    </div>
                                    <div className="flex justify-between pt-0.5">
                                        <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                                        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {books.length > 0 ? (
                <>
                    {/* Mobile horizontal scroll — wrapper needed so overlay isn't clipped by overflow-x-auto */}
                    <div className="md:hidden relative">
                        <div
                            className="w-[90vw] carousel-scroll-container overflow-x-auto scroll-smooth pb-4 pl-4 pr-2 snap-x snap-proximity"
                            style={{
                                touchAction: 'pan-x pan-y',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            <div className="flex gap-4 w-max">
                                {books.map((book) => (
                                    <div key={book.id} className="flex-none w-[170px] snap-start">
                                        <BookCard book={book} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Swipe hint gesture overlay — outside overflow div so it's not clipped */}
                        {showSwipeHint && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                                <div className="swipe-hint-finger relative flex items-center justify-center">
                                    {/* Ripple ring */}
                                    <span className="swipe-hint-ripple absolute w-12 h-12 rounded-full border-2 border-white/80" />
                                    {/* Arrow circle */}
                                    <svg
                                        width="42" height="42" viewBox="0 0 42 42" fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="drop-shadow-xl"
                                    >
                                        <circle cx="21" cy="21" r="20" fill="rgba(0,0,0,0.55)" />
                                        <path d="M13 21h16M23 15l7 6-7 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {/* "Swipe" label */}
                                    <span className="ml-2 text-white text-xs font-semibold bg-black/50 rounded-full px-2.5 py-1 whitespace-nowrap shadow">
                                        swipe
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop carousel with navigation */}
                    <div className="hidden md:block relative overflow-hidden">
                        <div
                            className="flex gap-4 transition-transform duration-500 ease-out snap-x snap-mandatory"
                            style={{
                                transform: `translateX(-${currentSlide * STEP}rem)`
                            }}
                        >
                            {books.map((book) => (
                                <div
                                    key={book.id}
                                    className="flex-none w-56 snap-start"
                                >
                                    <BookCard book={book} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-secondary-black text-lg">{emptyMessage}</p>
                    {showEmptyBrowseButton && (
                        <Link href="/catalog">
                            <Button className="mt-4 bg-primary-aqua hover:bg-secondary-aqua">
                                Browse All Books
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </>
    );
};

export default BookCarousel;
