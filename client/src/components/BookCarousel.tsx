import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

interface BookCarouselProps {
    books: Book[];
    bgGradient?: string;
    emptyMessage?: string;
    showEmptyBrowseButton?: boolean;
    isLoading?: boolean;
}

const BookCarousel: React.FC<BookCarouselProps> = ({
    books,
    emptyMessage = "No books available at the moment.",
    showEmptyBrowseButton = true,
    isLoading = false,
}) => {
    const CARD_WIDTH_REM = 14; // w-56 = 14rem
    const GAP_REM = 1;        // gap-4 = 1rem
    const STEP = CARD_WIDTH_REM + GAP_REM;
    const VISIBLE_CARDS = 2 + Math.floor((window.innerWidth - 640) / (CARD_WIDTH_REM * 16 + GAP_REM * 16)); // 2 cards for mobile + additional for desktop
    const [currentSlide, setCurrentSlide] = useState(0);
    const maxSlide = Math.max(0, books.length - VISIBLE_CARDS);

    const handlePrevious = () => {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
    };

    // Loading skeleton component
    if (isLoading) {
        return (
            <div className="animate-pulse">
                {/* Mobile skeleton */}
                {/* Mobile skeleton (updated to match BookCard) */}
                <div className="md:hidden w-[90vw] overflow-x-auto pb-4 pl-4 pr-2">
                    <div className="flex gap-4 w-max animate-pulse">
                        {Array.from({ length: VISIBLE_CARDS }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-none w-64 rounded-xl bg-white shadow-sm border"
                            >
                                {/* Book image */}
                                <div className="aspect-[3/4] bg-gray-300 rounded-t-xl" />

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    {/* Title */}
                                    <div className="h-4 bg-gray-300 rounded w-5/6" />

                                    {/* Author */}
                                    <div className="h-3 bg-gray-300 rounded w-2/3" />

                                    {/* Price / rating row */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="h-4 bg-gray-300 rounded w-1/3" />
                                        <div className="h-3 bg-gray-300 rounded w-1/4" />
                                    </div>

                                    {/* CTA button */}
                                    <div className="h-9 bg-gray-300 rounded-lg mt-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    <div className="flex gap-3 sm:gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex-none w-56 bg-gray-200 rounded-lg">
                                <div className="aspect-[3/4] bg-gray-300 rounded-t-lg"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
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
                    {/* Mobile horizontal scroll */}
                    <div
                        className="md:hidden w-[90vw] carousel-scroll-container overflow-x-auto scroll-smooth pb-4 pl-4 pr-2 snap-x snap-proximity"
                        style={{
                            touchAction: 'pan-x pan-y',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <div className="flex gap-4 w-max">
                            {books.map((book) => (
                                <div key={book.id} className="flex-none w-64 snap-start">
                                    <BookCard book={book} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop carousel with navigation */}
                    <div className="hidden md:block relative overflow-hidden">
                        <button
                            onClick={handlePrevious}
                            disabled={currentSlide === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 border border-primary-aqua/30"
                        >
                            <ChevronLeft className="h-8 w-8 text-primary-aqua mx-auto" />
                        </button>
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
                        <button
                            onClick={handleNext}
                            disabled={currentSlide >= maxSlide}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 border border-primary-aqua/30"
                        >
                            <ChevronRight className="h-8 w-8 text-primary-aqua mx-auto" />
                        </button>
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
