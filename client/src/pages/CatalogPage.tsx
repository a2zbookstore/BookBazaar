import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Category } from "@/types";
import { ChevronRight, Filter } from "lucide-react";

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
  
  const itemsPerPage = 12;

  // Update filters when URL changes
  useEffect(() => {
    console.log("Location changed:", location);
    const urlParts = location.split('?');
    const queryString = urlParts[1] || '';
    console.log("Query string:", queryString);
    const params = new URLSearchParams(queryString);
    setSearchParams(params);
    const searchParam = params.get('search') || '';
    console.log("Extracted search param:", searchParam);
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
    
    if (params.get('category')) {
      setSelectedCategories([params.get('category')!]);
    }
    if (params.get('featured')) {
      // Handle featured filter if needed
    }
  }, [location]);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (selectedCategories.length > 0) queryParams.set('categoryId', selectedCategories[0]); // For now, just use first category
  if (selectedConditions.length > 0) queryParams.set('condition', selectedConditions[0]); // For now, just use first condition
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortOrder', sortOrder);
  queryParams.set('limit', itemsPerPage.toString());
  queryParams.set('offset', ((currentPage - 1) * itemsPerPage).toString());

  const apiUrl = `/api/books?${queryParams.toString()}`;
  console.log("Final API URL:", apiUrl);
  console.log("Current search state:", search);

  const { data: booksResponse, isLoading } = useQuery<BooksResponse>({
    queryKey: ['/api/books', {
      search,
      categoryId: selectedCategories[0],
      condition: selectedConditions[0], 
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage
    }],
    queryFn: async () => {
      console.log("Fetching books with API URL:", apiUrl);
      console.log("Search parameter in queryFn:", search);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      console.log("API response:", data);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the results
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

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-secondary-black">
            <a href="/" className="hover:text-primary-aqua">Home</a>
            <ChevronRight className="h-4 w-4" />
            <span>Catalog</span>
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filters</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Search</Label>
                  <Input
                    type="text"
                    placeholder="Search books..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Category</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id.toString())}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category.id.toString(), checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`category-${category.id}`}
                            className="text-sm text-secondary-black cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Condition</Label>
                  <div className="space-y-2">
                    {conditions.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`condition-${condition}`}
                          checked={selectedConditions.includes(condition)}
                          onCheckedChange={(checked) => 
                            handleConditionChange(condition, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`condition-${condition}`}
                          className="text-sm text-secondary-black cursor-pointer"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Sort Options */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-secondary-black">
                Showing {books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks} results
              </p>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Books Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
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
                            className={currentPage === pageNum ? "bg-primary-aqua hover:bg-secondary-aqua" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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
      </div>
    </Layout>
  );
}
