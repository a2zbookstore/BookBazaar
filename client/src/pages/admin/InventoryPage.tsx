import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Upload,
  Download,
  BookOpen,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Book, Category } from "@/types";

/* ===================== TYPES ===================== */

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

/* ===================== CONSTANTS ===================== */

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

const CONDITION_STYLE: Record<string, string> = {
  "new":       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "like new":  "bg-teal-50 text-teal-700 border border-teal-200",
  "very good": "bg-blue-50 text-blue-700 border border-blue-200",
  "good":      "bg-amber-50 text-amber-700 border border-amber-200",
  "fair":      "bg-rose-50 text-rose-700 border border-rose-200",
};

const getConditionStyle = (c: string) =>
  CONDITION_STYLE[c.toLowerCase()] ?? "bg-gray-100 text-gray-600";

/* ===================== COMPONENT ===================== */

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  /* ===================== QUERIES ===================== */

  const queryParams = new URLSearchParams({
    limit: itemsPerPage.toString(),
    offset: ((currentPage - 1) * itemsPerPage).toString(),
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  if (search) queryParams.set("search", search);
  if (selectedCategory) queryParams.set("categoryId", selectedCategory);
  if (selectedCondition) queryParams.set("condition", selectedCondition);

  const { data, isLoading, error, refetch } = useQuery<BooksResponse>({
    queryKey: ["books", search, selectedCategory, selectedCondition, currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/books?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load books");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
  });

  const books = data?.books ?? [];
  const totalBooks = data?.total ?? 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

  const lowStockCount = books.filter((b) => b.stock <= 3).length;
  const featuredCount = books.filter((b) => b.featured).length;

  /* ===================== MUTATIONS ===================== */

  const createBookMutation = useMutation({
    mutationFn: async (form: BookForm) => {
      await apiRequest("POST", "/api/books", {
        ...form,
        price: parseFloat(form.price),
        categoryId: form.categoryId || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Book added successfully" });
      setIsDialogOpen(false);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      await apiRequest("PUT", `/api/books/${id}`, {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Book updated successfully" });
      setIsDialogOpen(false);
      setEditingBook(null);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Book removed from inventory" });
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  /* ===================== HELPERS ===================== */

  const openAddDialog = () => {
    setEditingBook(null);
    setBookForm(initialBookForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      categoryId: book.categoryId || null,
      description: book.description || "",
      condition: book.condition,
      binding: book.binding || "No Binding",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingBook
      ? updateBookMutation.mutate({ id: editingBook.id, data: bookForm })
      : createBookMutation.mutate(bookForm);
  };

  const isSubmitting = createBookMutation.isPending || updateBookMutation.isPending;

  const hasActiveFilters = search || selectedCategory || selectedCondition;

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedCondition("");
    setCurrentPage(1);
  };

  /* ===================== BOOK FORM DIALOG ===================== */

  const BookFormDialog = (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) { setEditingBook(null); setBookForm(initialBookForm); }
    }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{editingBook ? "Edit Book" : "Add Book"}</DialogTitle>
        </DialogHeader>

        {/* hero */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {editingBook ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">{editingBook ? "Edit Book" : "Add New Book"}</h3>
              <p className="text-sm text-emerald-200">
                {editingBook ? `Editing: ${editingBook.title}` : "Fill in the details below"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Core info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Core Information</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Title *</Label>
                <Input placeholder="Book title" value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Author *</Label>
                <Input placeholder="Author name" value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  required className="rounded-xl" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-gray-500">Description</Label>
                <Textarea placeholder="Book description…" value={bookForm.description} rows={3}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="rounded-xl resize-none" />
              </div>
            </div>
          </div>

          {/* Pricing & stock */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Pricing & Stock</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Price ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={bookForm.price}
                  onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Stock</Label>
                <Input type="number" min={0} value={bookForm.stock}
                  onChange={(e) => setBookForm({ ...bookForm, stock: Number(e.target.value) })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Category</Label>
                <Select
                  value={bookForm.categoryId ? bookForm.categoryId.toString() : "none"}
                  onValueChange={(v) => setBookForm({ ...bookForm, categoryId: v === "none" ? null : parseInt(v) })}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(categories as Category[]).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Condition & Details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Condition & Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Condition</Label>
                <Select value={bookForm.condition} onValueChange={(v) => setBookForm({ ...bookForm, condition: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Binding</Label>
                <Select value={bookForm.binding} onValueChange={(v) => setBookForm({ ...bookForm, binding: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bindings.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Language</Label>
                <Input placeholder="English" value={bookForm.language}
                  onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">ISBN</Label>
                <Input placeholder="ISBN" value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Publisher</Label>
                <Input placeholder="Publisher" value={bookForm.publisher}
                  onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Year</Label>
                <Input type="number" placeholder="2024" value={bookForm.publishedYear ?? ""}
                  onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value ? Number(e.target.value) : null })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Pages</Label>
                <Input type="number" placeholder="250" value={bookForm.pages ?? ""}
                  onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value ? Number(e.target.value) : null })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Weight</Label>
                <Input placeholder="e.g. 300g" value={bookForm.weight}
                  onChange={(e) => setBookForm({ ...bookForm, weight: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Dimensions</Label>
                <Input placeholder="e.g. 21×14cm" value={bookForm.dimensions}
                  onChange={(e) => setBookForm({ ...bookForm, dimensions: e.target.value })}
                  className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Image & featured */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Image & Visibility</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Image URL</Label>
                <Input placeholder="https://…" value={bookForm.imageUrl}
                  onChange={(e) => setBookForm({ ...bookForm, imageUrl: e.target.value })}
                  className="rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={bookForm.featured}
                  onCheckedChange={(v) => setBookForm({ ...bookForm, featured: Boolean(v) })}
                />
                <Label htmlFor="featured" className="text-sm cursor-pointer">
                  Mark as <span className="font-semibold text-amber-600">Featured</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {editingBook ? "Saving…" : "Adding…"}
                </span>
              ) : (editingBook ? "Save Changes" : "Add Book")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  /* ===================== DELETE CONFIRM DIALOG ===================== */

  const DeleteDialog = (
    <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
      <DialogContent className="max-w-sm rounded-2xl p-6 text-center space-y-4">
        <DialogHeader className="sr-only"><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Remove this book?</p>
          <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setDeleteConfirmId(null)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
            disabled={deleteBookMutation.isPending}
            onClick={() => deleteConfirmId && deleteBookMutation.mutate(deleteConfirmId)}
          >
            {deleteBookMutation.isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ===================== MAIN RENDER ===================== */

  return (
    <div className="space-y-6">

      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Inventory Management</h1>
            <p className="mt-1 text-sm text-emerald-100">Add, edit and track your book catalogue</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalBooks}</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wide">Total Books</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">{featuredCount}</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wide">Featured</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-300">{lowStockCount}</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wide">Low Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={openAddDialog}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Book
          </Button>
          <Button variant="outline" className="rounded-xl h-9 text-gray-600">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            className="rounded-xl h-9 text-gray-600"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1.5" /> Import
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 rounded-xl"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 rounded-xl border-gray-200"
                placeholder="Search by title, author, ISBN…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearch("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); setCurrentPage(1); }}
            >
              <SelectTrigger className="sm:w-44 rounded-xl border-gray-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories as Category[]).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCondition || "all"}
              onValueChange={(v) => { setSelectedCondition(v === "all" ? "" : v); setCurrentPage(1); }}
            >
              <SelectTrigger className="sm:w-40 rounded-xl border-gray-200">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl text-gray-500 shrink-0">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Book list */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b px-5 py-3.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600">
              {hasActiveFilters
                ? `${books.length} result${books.length !== 1 ? "s" : ""} found`
                : `Showing ${books.length} of ${totalBooks} books`}
            </CardTitle>
            <span className="text-xs text-gray-400">Page {currentPage} of {Math.max(totalPages, 1)}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm text-gray-500">Loading inventory…</p>
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Package className="h-12 w-12 opacity-30" />
              <p className="text-sm">No books found{hasActiveFilters ? " for this filter" : ""}.</p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-emerald-600">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex gap-3 sm:gap-4 p-4 hover:bg-emerald-50/30 transition-colors group"
                >
                  {/* Cover */}
                  <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                    {book.imageUrl ? (
                      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">
                        {book.title}
                        {book.featured && (
                          <Star className="inline h-3.5 w-3.5 text-amber-400 fill-amber-400 ml-1.5 shrink-0" />
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500">{book.author}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getConditionStyle(book.condition)}`}>
                        {book.condition}
                      </span>
                      {book.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          {book.category.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-base font-bold text-emerald-700">
                        ${parseFloat(book.price).toFixed(2)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        book.stock === 0
                          ? "bg-red-100 text-red-700"
                          : book.stock <= 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {book.stock === 0
                          ? "Out of stock"
                          : book.stock <= 3
                            ? <><AlertTriangle className="h-3 w-3" /> {book.stock} left</>
                            : `${book.stock} in stock`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(book)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 hover:text-emerald-700"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(book.id)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 rounded-lg ${currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 border-0" : ""}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {BookFormDialog}
      {DeleteDialog}
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Book, Category } from "@/types";

/* ===================== TYPES ===================== */

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

/* ===================== CONSTANTS ===================== */

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

/* ===================== COMPONENT ===================== */

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

  /* ===================== QUERIES ===================== */

  const queryParams = new URLSearchParams({
    limit: itemsPerPage.toString(),
    offset: ((currentPage - 1) * itemsPerPage).toString(),
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  if (search) queryParams.set("search", search);
  if (selectedCategory) queryParams.set("categoryId", selectedCategory);
  if (selectedCondition) queryParams.set("condition", selectedCondition);

  const { data, isLoading, error } = useQuery<BooksResponse>({
    queryKey: ["books", search, selectedCategory, selectedCondition, currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/books?${queryParams}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load books");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
  });

  const books = data?.books ?? [];
  const totalBooks = data?.total ?? 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

  const createBookMutation = useMutation({
    mutationFn: async (form: BookForm) => {
      await apiRequest("POST", "/api/books", {
        ...form,
        price: parseFloat(form.price),
        categoryId: form.categoryId || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Book added" });
      setIsDialogOpen(false);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      await apiRequest("PUT", `/api/books/${id}`, {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Book updated" });
      setIsDialogOpen(false);
      setEditingBook(null);
      setBookForm(initialBookForm);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Book deleted" });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  /* ===================== HELPERS ===================== */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingBook
      ? updateBookMutation.mutate({ id: editingBook.id, data: bookForm })
      : createBookMutation.mutate(bookForm);
  };

  const getConditionColor = (c: string) =>
    ({
      new: "bg-green-100 text-green-800",
      "like new": "bg-blue-100 text-blue-800",
      "very good": "bg-yellow-100 text-yellow-800",
      good: "bg-orange-100 text-orange-800",
      fair: "bg-red-100 text-red-800",
    }[c.toLowerCase()] || "bg-gray-100 text-gray-800");

  /* ===================== UI ===================== */

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm text-gray-600">
            Manage books and stock levels
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Book
              </Button>
            </DialogTrigger>

            {/* FORM DIALOG */}
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBook ? "Edit Book" : "Add Book"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Title"
                    value={bookForm.title}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, title: e.target.value })
                    }
                    required
                  />
                  <Input
                    placeholder="Author"
                    value={bookForm.author}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, author: e.target.value })
                    }
                    required
                  />
                </div>

                <Textarea
                  placeholder="Description"
                  value={bookForm.description}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, description: e.target.value })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={bookForm.price}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, price: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={bookForm.stock}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        stock: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    placeholder="Language"
                    value={bookForm.language}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, language: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBook ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SEARCH */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* BOOK LIST */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg overflow-hidden"
            >
              <div className="w-16 h-20 shrink-0 bg-gray-100 rounded flex items-center justify-center">
                {book.imageUrl ? (
                  <img
                    src={book.imageUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-2 break-words">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={getConditionColor(book.condition)}>
                    {book.condition}
                  </Badge>
                  {book.featured && <Badge>Featured</Badge>}
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBook(book)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteBookMutation.mutate(book.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
