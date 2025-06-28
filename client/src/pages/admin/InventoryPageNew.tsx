import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Package, Upload, Download, FileText } from "lucide-react";

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
  edition: string;
  weight: string;
  dimensions: string;
  featured: boolean;
  bestseller: boolean;
}

export default function InventoryPageNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const [bookForm, setBookForm] = useState<BookForm>({
    title: "",
    author: "",
    isbn: "",
    categoryId: null,
    description: "",
    condition: "Good",
    binding: "Softcover",
    price: "",
    stock: 1,
    imageUrl: "",
    publishedYear: null,
    publisher: "",
    pages: null,
    language: "English",
    edition: "",
    weight: "",
    dimensions: "",
    featured: false,
    bestseller: false,
  });

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
      const response = await fetch(`/api/books?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
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
      console.log("Form data being submitted:", data);
      
      const bookData = {
        title: data.title,
        author: data.author,
        isbn: data.isbn || "",
        categoryId: data.categoryId || null,
        description: data.description || "",
        condition: data.condition,
        binding: data.binding,
        price: data.price && data.price.trim() !== "" ? parseFloat(data.price).toString() : "0",
        stock: data.stock || 0,
        imageUrl: data.imageUrl || "",
        publishedYear: data.publishedYear || null,
        publisher: data.publisher || "",
        pages: data.pages || null,
        language: data.language || "English",
        weight: data.weight && data.weight.trim() !== "" ? parseFloat(data.weight).toString() : null,
        dimensions: data.dimensions || "",
        featured: data.featured || false,
        bestseller: data.bestseller || false,
      };
      
      console.log("Processed book data:", bookData);
      return apiRequest('POST', '/api/books', bookData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Book created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: BookForm) => {
      if (!editingBook) throw new Error("No book selected for editing");
      const bookData = {
        title: data.title,
        author: data.author,
        isbn: data.isbn || "",
        categoryId: data.categoryId || null,
        description: data.description || "",
        condition: data.condition,
        binding: data.binding,
        price: data.price && data.price.trim() !== "" ? parseFloat(data.price).toString() : "0",
        stock: data.stock || 0,
        imageUrl: data.imageUrl || "",
        publishedYear: data.publishedYear || null,
        publisher: data.publisher || "",
        pages: data.pages || null,
        language: data.language || "English",
        weight: data.weight && data.weight.trim() !== "" ? parseFloat(data.weight).toString() : null,
        dimensions: data.dimensions || "",
        featured: data.featured || false,
        bestseller: data.bestseller || false,
      };
      return apiRequest('PUT', `/api/books/${editingBook.id}`, bookData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Book updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false);
      setEditingBook(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Book deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setBookForm({
      title: "",
      author: "",
      isbn: "",
      categoryId: null,
      description: "",
      condition: "Good",
      binding: "Softcover",
      price: "",
      stock: 1,
      imageUrl: "",
      publishedYear: null,
      publisher: "",
      pages: null,
      language: "English",
      edition: "",
      weight: "",
      dimensions: "",
      featured: false,
      bestseller: false,
    });
    setEditingBook(null);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      categoryId: book.categoryId || null,
      description: book.description || "",
      condition: book.condition || "Good",
      binding: book.binding || "Softcover",
      price: book.price?.toString() || "",
      stock: book.stock || 1,
      imageUrl: book.imageUrl || "",
      publishedYear: book.publishedYear || null,
      publisher: book.publisher || "",
      pages: book.pages || null,
      language: book.language || "English",
      edition: book.edition || "",
      weight: book.weight || "",
      dimensions: book.dimensions || "",
      featured: book.featured || false,
      bestseller: book.bestseller || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!bookForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!bookForm.author.trim()) {
      toast({
        title: "Validation Error", 
        description: "Author is required",
        variant: "destructive",
      });
      return;
    }
    
    // Price validation - allow empty price (will default to 0)
    if (bookForm.price && bookForm.price.trim() !== "" && (parseFloat(bookForm.price) < 0 || isNaN(parseFloat(bookForm.price)))) {
      toast({
        title: "Validation Error",
        description: "Price must be a positive number",
        variant: "destructive",
      });
      return;
    }
    
    if (editingBook) {
      updateBookMutation.mutate(bookForm);
    } else {
      createBookMutation.mutate(bookForm);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/books/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update the form with the uploaded image URL
      setBookForm(prev => ({ ...prev, imageUrl: result.imageUrl }));
      
      toast({
        title: "Image Uploaded",
        description: "Book cover image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/books/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const results = await response.json();
      setImportResults(results);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${results.success} books`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "title,author,isbn,condition,binding,price,stock,description,categoryId,publishedYear,publisher,pages,language,weight,dimensions,featured\n\"The Great Gatsby\",\"F. Scott Fitzgerald\",\"9780743273565\",\"Good\",\"Softcover\",\"12.99\",\"5\",\"A classic novel\",\"1\",\"1925\",\"Scribner\",\"180\",\"English\",\"0.3kg\",\"20x13cm\",\"false\"";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportBooks = async () => {
    try {
      const response = await fetch('/api/books/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `books_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Books exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export books",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like new":
        return "bg-blue-100 text-blue-800";
      case "very good":
        return "bg-purple-100 text-purple-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "acceptable":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bookerly font-bold text-base-black">
            Inventory Management
          </h1>
          
          <div className="flex gap-2">
            {/* Import/Export Buttons */}
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Template
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isUploading}
              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Importing..." : "Import"}
            </Button>
            
            <Button
              onClick={exportBooks}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />

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
                      <select
                        id="category"
                        value={bookForm.categoryId?.toString() || ""}
                        onChange={(e) => setBookForm(prev => ({ 
                          ...prev, 
                          categoryId: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id.toString()}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
                      <select
                        id="condition"
                        value={bookForm.condition}
                        onChange={(e) => setBookForm(prev => ({ ...prev, condition: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select condition</option>
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Acceptable">Acceptable</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="binding">Binding</Label>
                      <select
                        id="binding"
                        value={bookForm.binding}
                        onChange={(e) => setBookForm(prev => ({ ...prev, binding: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select binding</option>
                        <option value="Hardcover">Hardcover</option>
                        <option value="Softcover">Softcover</option>
                        <option value="No Binding">No Binding</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={bookForm.price}
                        onChange={(e) => setBookForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={bookForm.stock}
                        onChange={(e) => setBookForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="publishedYear">Published Year</Label>
                      <Input
                        id="publishedYear"
                        type="number"
                        min="1000"
                        max={new Date().getFullYear()}
                        value={bookForm.publishedYear || ""}
                        onChange={(e) => setBookForm(prev => ({ 
                          ...prev, 
                          publishedYear: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="publisher">Publisher</Label>
                      <Input
                        id="publisher"
                        value={bookForm.publisher}
                        onChange={(e) => setBookForm(prev => ({ ...prev, publisher: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Book Cover Image</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          id="imageUrl"
                          type="url"
                          value={bookForm.imageUrl}
                          onChange={(e) => setBookForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://example.com/book-cover.jpg"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isImageUploading}
                          className="whitespace-nowrap"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isImageUploading ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                      {bookForm.imageUrl && (
                        <div className="w-20 h-28 border rounded overflow-hidden">
                          <img
                            src={bookForm.imageUrl.startsWith('/uploads/images/') || bookForm.imageUrl.startsWith('http') ? 
                              bookForm.imageUrl : 
                              `/uploads/images/${bookForm.imageUrl}`}
                            alt="Book cover preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiB2aWV3Qm94PSIwIDAgODAgMTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNS41IDQySDQ0LjVWNTFIMzUuNVY0MlpNMjYuNSA2MEg1My41VjUxSDI2LjVWNjBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=";
                            }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        You can either paste an image URL or upload an image file (max 5MB)
                      </p>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
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
                      <Label htmlFor="edition">Edition</Label>
                      <Input
                        id="edition"
                        value={bookForm.edition}
                        onChange={(e) => setBookForm(prev => ({ ...prev, edition: e.target.value }))}
                        placeholder="1st Edition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        value={bookForm.weight}
                        onChange={(e) => setBookForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="1.2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions (inches)</Label>
                      <Input
                        id="dimensions"
                        value={bookForm.dimensions}
                        onChange={(e) => setBookForm(prev => ({ ...prev, dimensions: e.target.value }))}
                        placeholder="8x5x1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bestseller"
                        checked={bookForm.bestseller}
                        onCheckedChange={(checked) => setBookForm(prev => ({ 
                          ...prev, 
                          bestseller: checked as boolean 
                        }))}
                      />
                      <Label htmlFor="bestseller">Bestseller</Label>
                    </div>
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Like New">Like New</SelectItem>
                  <SelectItem value="Very Good">Very Good</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Acceptable">Acceptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books List */}
        <Card>
          <CardHeader>
            <CardTitle>Books ({totalBooks})</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Books</h3>
                <p className="text-gray-600 mb-4">
                  {error instanceof Error ? error.message : 'Failed to load books'}
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  Reload Page
                </Button>
              </div>
            ) : isLoading ? (
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
                            {book.binding && (
                              <Badge variant="outline" className="text-xs">
                                {book.binding}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              ${book.price}
                            </Badge>
                            <Badge variant={book.stock <= 5 ? "destructive" : "default"} className="text-xs">
                              Stock: {book.stock}
                            </Badge>
                            {book.featured && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(book)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBookMutation.mutate(book.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600 mb-4">
                  {search || selectedCategory || selectedCondition
                    ? "No books match your current filters."
                    : "Get started by adding your first book to the inventory."
                  }
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
    );
  }