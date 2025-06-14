import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Package, Upload, Download, FileText } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Book, Category } from "@/types";

interface BooksResponse {
  books: Book[];
  total: number;
}

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  categoryId: number | null;
  description: string;
  condition: string;
  binding: string;
  price: string;
  stock: number;
  imageUrl: string;
  publishedYear: number | null;
  publisher: string;
  pages: number | null;
  language: string;
  weight: string;
  dimensions: string;
  featured: boolean;
}

const initialBookForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  categoryId: null,
  description: "",
  condition: "New",
  binding: "No Binding",
  price: "",
  stock: 1,
  imageUrl: "",
  publishedYear: null,
  publisher: "",
  pages: null,
  language: "English",
  weight: "",
  dimensions: "",
  featured: false,
};

const conditions = ["New", "Like New", "Very Good", "Good", "Fair"];
const bindings = ["Softcover", "Hardcover", "No Binding"];

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState<BookForm>(initialBookForm);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (selectedCategory) queryParams.set('categoryId', selectedCategory);
  if (selectedCondition) queryParams.set('condition', selectedCondition);
  queryParams.set('limit', itemsPerPage.toString());
  queryParams.set('offset', ((currentPage - 1) * itemsPerPage).toString());
  queryParams.set('sortBy', 'updatedAt');
  queryParams.set('sortOrder', 'desc');

  const { data: booksResponse, isLoading, error } = useQuery<BooksResponse>({
    queryKey: ["/api/books", {
      search,
      categoryId: selectedCategory,
      condition: selectedCondition,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/books?${queryParams.toString()}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Error fetching books:', err);
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const books = booksResponse?.books || [];
  const totalBooks = booksResponse?.total || 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

  const createBookMutation = useMutation({
    mutationFn: async (data: BookForm) => {
      const bookData = {
        ...data,
        price: parseFloat(data.price),
        publishedYear: data.publishedYear || undefined,
        pages: data.pages || undefined,
        categoryId: data.categoryId || undefined,
      };
      await apiRequest("POST", "/api/books", bookData);
    },
    onSuccess: () => {
      toast({
        title: "Book created",
        description: "The book has been added to inventory.",
      });
      setIsDialogOpen(false);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create book",
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BookForm> }) => {
      const bookData = {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
        publishedYear: data.publishedYear || undefined,
        pages: data.pages || undefined,
        categoryId: data.categoryId || undefined,
      };
      await apiRequest("PUT", `/api/books/${id}`, bookData);
    },
    onSuccess: () => {
      toast({
        title: "Book updated",
        description: "The book has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingBook(null);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update book",
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Book deleted",
        description: "The book has been removed from inventory.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data: bookForm });
    } else {
      createBookMutation.mutate(bookForm);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      categoryId: book.categoryId || null,
      description: book.description || "",
      condition: book.condition,
      price: book.price,
      stock: book.stock,
      imageUrl: book.imageUrl || "",
      publishedYear: book.publishedYear || null,
      publisher: book.publisher || "",
      pages: book.pages || null,
      language: book.language || "English",
      weight: book.weight || "",
      dimensions: book.dimensions || "",
      featured: book.featured,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (book: Book) => {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      deleteBookMutation.mutate(book.id);
    }
  };

  const resetForm = () => {
    setBookForm(initialBookForm);
    setEditingBook(null);
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like new":
        return "bg-blue-100 text-blue-800";
      case "very good":
        return "bg-yellow-100 text-yellow-800";
      case "good":
        return "bg-orange-100 text-orange-800";
      case "fair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bookerly font-bold text-base-black">Inventory Management</h1>
            <p className="text-secondary-black">Manage your book collection and stock levels.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-primary-aqua hover:bg-secondary-aqua">
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBook ? "Edit Book" : "Add New Book"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={bookForm.title}
                      onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={bookForm.author}
                      onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={bookForm.categoryId?.toString() || undefined} 
                      onValueChange={(value) => setBookForm(prev => ({ 
                        ...prev, 
                        categoryId: value ? parseInt(value) : null 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={bookForm.description}
                    onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="condition">Condition *</Label>
                    <Select 
                      value={bookForm.condition} 
                      onValueChange={(value) => setBookForm(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={bookForm.price}
                      onChange={(e) => setBookForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={bookForm.stock}
                      onChange={(e) => setBookForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={bookForm.imageUrl}
                    onChange={(e) => setBookForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/book-cover.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm(prev => ({ ...prev, publisher: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="publishedYear">Published Year</Label>
                    <Input
                      id="publishedYear"
                      type="number"
                      value={bookForm.publishedYear || ""}
                      onChange={(e) => setBookForm(prev => ({ 
                        ...prev, 
                        publishedYear: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pages">Pages</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={bookForm.pages || ""}
                      onChange={(e) => setBookForm(prev => ({ 
                        ...prev, 
                        pages: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={bookForm.language}
                      onChange={(e) => setBookForm(prev => ({ ...prev, language: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      value={bookForm.weight}
                      onChange={(e) => setBookForm(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={bookForm.dimensions}
                    onChange={(e) => setBookForm(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="20x15x3 cm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={bookForm.featured}
                    onCheckedChange={(checked) => setBookForm(prev => ({ 
                      ...prev, 
                      featured: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="featured">Featured book</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBookMutation.isPending || updateBookMutation.isPending}
                    className="bg-primary-aqua hover:bg-secondary-aqua"
                  >
                    {editingBook ? "Update" : "Create"} Book
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search books by title, author, or ISBN..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory || undefined} onValueChange={(value) => {
                setSelectedCategory(value === "all" ? "" : value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCondition || undefined} onValueChange={(value) => {
                setSelectedCondition(value === "all" ? "" : value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books Table */}
        <Card>
          <CardHeader>
            <CardTitle>Books ({totalBooks})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded">
                    <div className="w-12 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-aqua/50 transition-colors">
                    {/* Book Image */}
                    <div className="w-12 h-16 flex-shrink-0">
                      {book.imageUrl ? (
                        <img
                          src={book.imageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base-black truncate">{book.title}</h3>
                          <p className="text-secondary-black text-sm">{book.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getConditionColor(book.condition)}`}>
                              {book.condition}
                            </Badge>
                            {book.featured && (
                              <Badge className="bg-abe-red text-white text-xs">Featured</Badge>
                            )}
                            {book.category && (
                              <Badge variant="outline" className="text-xs">
                                {book.category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-primary-aqua">€{parseFloat(book.price).toFixed(2)}</p>
                          <p className="text-sm text-secondary-black">Stock: {book.stock}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(book)}
                        className="text-primary-aqua hover:text-secondary-aqua"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(book)}
                        className="text-abe-red hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-base-black mb-2">No books found</h3>
                <p className="text-secondary-black mb-4">
                  {search || selectedCategory || selectedCondition
                    ? "Try adjusting your search criteria"
                    : "Get started by adding your first book to the inventory"}
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
