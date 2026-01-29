import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  console.log('CatalogPage mounted or rendered');
  const [location] = useLocation();
  // const [searchParams, setSearchParams] = useState(new URLSearchParams());

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

  // useEffect(() => {
  //   // Use router location for search params
  //   const url = location || '';
  //   const queryString = url.includes('?') ? url.split('?')[1] : '';
  //   const params = new URLSearchParams(queryString);
  //   console.log('CatalogPage useEffect triggered. location:', location, 'queryString:', queryString);
  //   setSearchParams(params);

  //   const searchParam = params.get('search') || '';
  //   console.log('Extracted searchParam:', searchParam);
  //   setSearch(searchParam);
  //   setCurrentPage(1);

  //   if (searchParam) {
  //     setSelectedCategories([]);
  //     setSelectedConditions([]);
  //     setMinPrice('');
  //     setMaxPrice('');
  //   }
  // }, [location]);

  useEffect(() => {
    console.log('CatalogPage useEffect triggered');
    console.log('location:', location);

    const queryString = location.split('?')[1] || '';
    console.log('Query string:', queryString);

    const params = new URLSearchParams(queryString);
    const searchParam = params.get('search') || '';
    console.log('Extracted searchParam:', searchParam);

    setSearch(searchParam);
    setCurrentPage(1);

    if (searchParam) {
      setSelectedCategories([]);
      setSelectedConditions([]);
      setMinPrice('');
      setMaxPrice('');
    }
  }, [location]);


  // Build query parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (selectedCategories.length > 0) queryParams.set('categoryId', selectedCategories[0]); // For now, just use first category
  if (selectedConditions.length > 0) queryParams.set('condition', selectedConditions[0]); // For now, just use first condition
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);

  // Check URL params for special filters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
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

  console.log('CatalogPage API URL:', apiUrl);
  const { data: booksResponse, isLoading } = useQuery<BooksResponse>({
    queryKey: ['/api/books', location, search, selectedCategories, selectedConditions, minPrice, maxPrice, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      console.log('API call triggered with URL:', apiUrl);
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
    <>
      <div className="container-custom">
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
              className="flex items-center gap-2 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedCategories.length > 0 || selectedConditions.length > 0 || minPrice || maxPrice) && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary-aqua text-white rounded-full">
                  {selectedCategories.length + selectedConditions.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="flex-1 flex justify-end w-full sm:w-auto">
              <SortFilterHeader
                currentCount={books.length}
                totalCount={totalBooks}
                startIndex={books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}
                endIndex={Math.min(currentPage * itemsPerPage, totalBooks)}
                sortValue={`${sortBy}-${sortOrder}`}
                onSortChange={handleSortChange}
                sortOptions={sortOptions ?? []}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
              <div className="grid gap-4 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                {books.map((book) => (
                  <div key={book.id} className="flex-[1_1_180px]">
                    <BookCard book={book} />
                  </div>
                ))}
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
    </>
  );
}
