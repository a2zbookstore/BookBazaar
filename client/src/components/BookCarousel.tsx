import React from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

interface BookCarouselProps {
    books: Book[];
    currentSlide: number;
    onSlideChange: (slide: number) => void;
    bgGradient?: string;
    emptyMessage?: string;
    showEmptyBrowseButton?: boolean;
    isLoading?: boolean;
}

const BookCarousel: React.FC<BookCarouselProps> = ({
    books,
    currentSlide,
    onSlideChange,
    emptyMessage = "No books available at the moment.",
    showEmptyBrowseButton = true,
    isLoading = false,
}) => {
    const handlePrevious = () => {
        onSlideChange(Math.max(0, currentSlide - 1));
    };

    const handleNext = () => {
        onSlideChange(Math.min(Math.ceil(books.length / 4) - 1, currentSlide + 1));
    };

    // Loading skeleton component
    if (isLoading) {
        return (
            <div className="animate-pulse">
                {/* Mobile skeleton */}
                <div className="md:hidden overflow-x-auto">
                    <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex-none bg-gray-200 rounded-lg" style={{ width: '200px', height: '320px' }}>
                                <div className="aspect-[3/4] bg-gray-300 rounded-t-lg"></div>
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    <div className="flex gap-3 sm:gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
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
                    {/* Mobile horizontal scroll view */}
                    <div className="md:hidden overflow-x-auto">
                        <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                            {books.map((book) => (
                                <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                                    <BookCard book={book} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop carousel view */}
                    <div className="hidden md:block relative overflow-hidden ">
                        <button
                            onClick={handlePrevious}
                            disabled={currentSlide === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 border-2 border-primary-aqua/20 hover:border-primary-aqua/50 group"
                        >
                            <ChevronLeft className="h-8 w-8 text-primary-aqua mx-auto group-hover:text-secondary-aqua transition-colors" />
                        </button>
                        <div
                            className=" flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                            style={{ transform: `translateX(-${currentSlide * 25}%)` }}
                        >
                            {books.map((book) => (
                                <div key={book.id} className="flex-none w-56">
                                    <BookCard book={book} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={currentSlide >= Math.ceil(books.length / 4) - 1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 border-2 border-primary-aqua/20 hover:border-primary-aqua/50 group"
                        >
                            <ChevronRight className="h-8 w-8 text-primary-aqua mx-auto group-hover:text-secondary-aqua transition-colors" />
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
