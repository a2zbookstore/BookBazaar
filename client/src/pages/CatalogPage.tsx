import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import BookCard from "@/components/BookCard";
import FiltersSidebar from "@/components/FiltersSidebar";
import SortFilterHeader from "@/components/SortFilterHeader";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Book, Category } from "@/types";
import { Filter } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";

interface BooksResponse {
  books: Book[];
  total: number;
}

export default function CatalogPage() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams());

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 15;

  // Update filters when URL changes
  useEffect(() => {
    // Extract search params from current URL properly
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);

    const searchParam = params.get('search') || '';
    // Only update search state if it's different
    if (searchParam !== search) {
      setSearch(searchParam);
      // Reset to first page when search changes
      setCurrentPage(1);

      // Reset other filters when coming from homepage search
      if (searchParam) {
        setSelectedCategories([]);
        setSelectedConditions([]);
        setMinPrice('');
        setMaxPrice('');
      }
    }

    // Handle other URL parameters
    const categoryParam = params.get('category');
    if (categoryParam && !searchParam) {
      setSelectedCategories([categoryParam]);
    }

    const featuredParam = params.get('featured');
    const bestsellerParam = params.get('bestseller');
    const trendingParam = params.get('trending');
    const newArrivalParam = params.get('newArrival');
    const boxSetParam = params.get('boxSet');
    if (featuredParam === 'true' && !searchParam) {
      // Handle featured filter if needed
    }
    if (bestsellerParam === 'true' && !searchParam) {
      // Handle bestseller filter if needed
    }
    if (trendingParam === 'true' && !searchParam) {
      // Handle trending filter if needed
    }
    if (newArrivalParam === 'true' && !searchParam) {
      // Handle new arrival filter if needed
    }
    if (boxSetParam === 'true' && !searchParam) {
      // Handle box set filter if needed
    }
  }, [location, search]);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (selectedCategories.length > 0) queryParams.set('categoryId', selectedCategories[0]); // For now, just use first category
  if (selectedConditions.length > 0) queryParams.set('condition', selectedConditions[0]); // For now, just use first condition
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);

  // Check URL params for special filters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('featured') === 'true') queryParams.set('featured', 'true');
  if (urlParams.get('bestseller') === 'true') queryParams.set('bestseller', 'true');
  if (urlParams.get('trending') === 'true') queryParams.set('trending', 'true');
  if (urlParams.get('newArrival') === 'true') queryParams.set('newArrival', 'true');
  if (urlParams.get('boxSet') === 'true') queryParams.set('boxSet', 'true');

  queryParams.set('sortBy', sortBy);
  queryParams.set('sortOrder', sortOrder);
  queryParams.set('limit', itemsPerPage.toString());
  queryParams.set('offset', ((currentPage - 1) * itemsPerPage).toString());

  const apiUrl = `/api/books?${queryParams.toString()}`;

  const { data: booksResponse, isLoading } = useQuery<BooksResponse>({
    queryKey: ['/api/books', search, selectedCategories, selectedConditions, minPrice, maxPrice, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      return data;
    },
    staleTime: 0,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const books = booksResponse?.books || [];
  const totalBooks = booksResponse?.total || 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);
  const conditions = ["New", "Like New", "Very Good", "Good", "Fair"];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
    setCurrentPage(1);
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    setSelectedConditions(prev =>
      checked
        ? [...prev, condition]
        : prev.filter(c => c !== condition)
    );
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'title-asc', label: 'Title: A to Z' },
    { value: 'title-desc', label: 'Title: Z to A' },
  ];

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Dynamic SEO based on filters
  const getPageTitle = () => {
    if (search) return `Search Results for "${search}"`;
    if (urlParams.get('featured') === 'true') return 'Featured Books';
    if (urlParams.get('bestseller') === 'true') return 'Bestselling Books';
    if (urlParams.get('trending') === 'true') return 'Trending Books';
    if (urlParams.get('newArrival') === 'true') return 'New Arrivals';
    if (urlParams.get('boxSet') === 'true') return 'Box Sets';
    if (selectedCategories.length > 0) {
      const category = categories.find(c => c.id.toString() === selectedCategories[0]);
      return category ? `${category.name} Books` : 'Book Catalog';
    }
    return 'All Books - Browse Our Complete Collection';
  };

  const getPageDescription = () => {
    if (search) return `Find books matching "${search}". Browse our extensive collection with ${totalBooks} results.`;
    if (selectedCategories.length > 0) {
      const category = categories.find(c => c.id.toString() === selectedCategories[0]);
      return category
        ? `Explore our ${category.name} collection. ${totalBooks} books available with fast delivery.`
        : 'Browse thousands of books across all categories at A2Z Bookshop.';
    }
    return 'Browse thousands of books across all categories. Fiction, non-fiction, bestsellers and more. Best prices with fast delivery.';
  };

  const getPageKeywords = () => {
    const baseKeywords = 'buy books online, online bookstore, book catalog';
    if (search) return `${search}, ${baseKeywords}`;
    if (selectedCategories.length > 0) {
      const category = categories.find(c => c.id.toString() === selectedCategories[0]);
      return category ? `${category.name} books, buy ${category.name}, ${baseKeywords}` : baseKeywords;
    }
    return `${baseKeywords}, fiction, non-fiction, bestsellers`;
  };

  useSEO({
    title: getPageTitle(),
    description: getPageDescription(),
    keywords: getPageKeywords()
  });

  return (
    <Layout>
      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "Catalog" }]} />

        {/* Floating Filters Sidebar */}
        <FiltersSidebar
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={(value) => {
            setMinPrice(value);
            setCurrentPage(1);
          }}
          onMaxPriceChange={(value) => {
            setMaxPrice(value);
            setCurrentPage(1);
          }}
          conditions={conditions}
          selectedConditions={selectedConditions}
          onConditionChange={handleConditionChange}
          onClearFilters={clearFilters}
          onApplyFilters={() => setCurrentPage(1)}
        />


        {/* Main Content - Full Width */}
        <div className="w-full">
          {/* Filter Button & Sort Options */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              className="flex items-center gap-2 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedCategories.length > 0 || selectedConditions.length > 0 || minPrice || maxPrice) && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary-aqua text-white rounded-full">
                  {selectedCategories.length + selectedConditions.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* <BannerCarousel
              banners={[{
                id: 1,
                image: "/uploads/images/banner/banner-3.png",
                alt: "Buy 3 Books Offer",
                link: "/catalog"
              },
              {
                id: 2,
                image: "/uploads/images/banner/banner-2.png",
                alt: "Shop for $499",
                link: "/catalog"
              },
              {
                id: 3,
                image: "/uploads/images/banner/banner-3.png",
                alt: "Shop for $999",
                link: "/catalog"
              }]}
              autoPlayInterval={5000}
              showIndicators={true}
              showNavigation={true}
              height="h-48 md:h-64"
            /> */}

            <div className="flex-1 flex justify-end w-full sm:w-auto">
              <SortFilterHeader
                currentCount={books.length}
                totalCount={totalBooks}
                startIndex={books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}
                endIndex={Math.min(currentPage * itemsPerPage, totalBooks)}
                sortValue={`${sortBy}-${sortOrder}`}
                onSortChange={handleSortChange}
                sortOptions={sortOptions}
                showResults={false}
              />
            </div>
          </div>

          {/* Results Count */}
          <p className="text-secondary-black mb-4">
            Showing {books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks} results
          </p>

          {/* Search Results Info */}
          {search && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Search results for: <strong>"{search}"</strong> ({totalBooks} {totalBooks === 1 ? 'book' : 'books'} found)
              </p>
            </div>
          )}

          {/* Books Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                    <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 book-grid">
                {books.map((book) => {
                  return <BookCard key={book.id} book={book} />;
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      Previous
                    </Button>

                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-full ${currentPage === pageNum ? "bg-primary-aqua hover:bg-secondary-aqua" : ""}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-bookerly font-semibold text-base-black mb-2">
                  No books found
                </h3>
                <p className="text-secondary-black mb-6">
                  Try adjusting your search criteria or browse our featured books.
                </p>
                <Button
                  onClick={clearFilters}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
