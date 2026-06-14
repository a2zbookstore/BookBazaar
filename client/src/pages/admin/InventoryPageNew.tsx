import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Edit, Trash2, Package, Upload, Download,
  FileText, CloudUpload, ChevronDown, X, BookOpen, Filter,
  SlidersHorizontal, RefreshCw, Image as ImageIcon, Star, Zap,
  TrendingUp, Tag, ChevronLeft, ChevronRight, Eye, EyeOff,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

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
import { Book, Category, SubCategory } from "@/types";
import BannerUploadPage from "./BannerUploadPage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const getImageSrc = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === "") {
    return "https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image";
  }
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  if (imageUrl.startsWith("/uploads/images/")) return imageUrl;
  const filename = imageUrl.split("/").pop() || imageUrl;
  return `/uploads/images/${filename}`;
};

interface BooksResponse { books: Book[]; total: number; }

interface BookForm {
  title: string; author: string; isbn: string; categoryIds: number[]; subCategoryId: number | null;
  description: string; condition: string; binding: string; price: string; costPrice: string;
  stock: number; imageUrl: string; imageUrl2: string; imageUrl3: string;
  publishedYear: number | null; publisher: string; pages: number | null;
  language: string; edition: string; weight: string; dimensions: string;
  featured: boolean; bestseller: boolean; trending: boolean; newArrival: boolean; boxSet: boolean;
}

const CONDITION_STYLES: Record<string, string> = {
  "New": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Like New": "bg-blue-100 text-blue-800 border-blue-200",
  "Very Good": "bg-violet-100 text-violet-800 border-violet-200",
  "Good": "bg-amber-100 text-amber-800 border-amber-200",
  "Acceptable": "bg-orange-100 text-orange-800 border-orange-200",
};

const EMPTY_FORM: BookForm = {
  title: "", author: "", isbn: "", categoryIds: [], subCategoryId: null, description: "",
  condition: "Good", binding: "Softcover", price: "", costPrice: "", stock: 1,
  imageUrl: "", imageUrl2: "", imageUrl3: "",
  publishedYear: null, publisher: "", pages: null, language: "English",
  edition: "", weight: "", dimensions: "",
  featured: false, bestseller: false, trending: false, newArrival: false, boxSet: false,
};

export default function InventoryPageNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef2 = useRef<HTMLInputElement>(null);
  const imageInputRef3 = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageUploading2, setIsImageUploading2] = useState(false);
  const [isImageUploading3, setIsImageUploading3] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedBinding, setSelectedBinding] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const [bookForm, setBookForm] = useState<BookForm>(EMPTY_FORM);
  type IsbnStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
  const [isbnStatus, setIsbnStatus] = useState<IsbnStatus>('idle');

  // Validate ISBN-10 or ISBN-13 format
  function isValidIsbnFormat(isbn: string): boolean {
    const clean = isbn.replace(/[\s\-]/g, '');
    if (clean.length === 10) return /^\d{9}[\dXx]$/.test(clean);
    if (clean.length === 13) return /^\d{13}$/.test(clean);
    return false;
  }

  // Reset ISBN status when dialog closes
  useEffect(() => {
    if (!isDialogOpen) setIsbnStatus('idle');
  }, [isDialogOpen]);

  // Debounced ISBN uniqueness check
  useEffect(() => {
    const isbn = bookForm.isbn.trim();
    if (!isbn) { setIsbnStatus('idle'); return; }
    if (!isValidIsbnFormat(isbn)) { setIsbnStatus('invalid'); return; }
    setIsbnStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const excludeParam = editingBook ? `&excludeId=${editingBook.id}` : '';
        const res = await fetch(`/api/books/check-isbn?isbn=${encodeURIComponent(isbn)}${excludeParam}`, { credentials: 'include' });
        if (!res.ok) { setIsbnStatus('idle'); return; }
        const data = await res.json();
        setIsbnStatus(data.exists ? 'duplicate' : 'valid');
      } catch {
        setIsbnStatus('idle');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [bookForm.isbn, editingBook]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (selectedCategory) queryParams.set("categoryId", selectedCategory);
  if (selectedCondition) queryParams.set("condition", selectedCondition);
  if (selectedBinding) queryParams.set("binding", selectedBinding);
  if (minPrice) queryParams.set("minPrice", minPrice);
  if (maxPrice) queryParams.set("maxPrice", maxPrice);
  queryParams.set("limit", itemsPerPage.toString());
  queryParams.set("offset", ((currentPage - 1) * itemsPerPage).toString());
  queryParams.set("sortBy", sortBy);
  queryParams.set("sortOrder", sortOrder);
  queryParams.set("includeOutOfStock", stockFilter === "outOfStock" ? "true" : stockFilter === "inStock" ? "false" : "true");
  queryParams.set("includeHidden", "true");
  if (selectedTag) queryParams.set(selectedTag, "true");

  const { data: booksResponse, isLoading, error } = useQuery<BooksResponse>({
    queryKey: ["/api/books", { search, categoryId: selectedCategory, condition: selectedCondition, binding: selectedBinding, minPrice, maxPrice, sortBy, sortOrder, stockFilter, selectedTag, limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage }],
    queryFn: async () => {
      const res = await fetch(`/api/books?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: allSubCategories = [] } = useQuery<SubCategory[]>({ queryKey: ["/api/subcategories"] });

  const books = booksResponse?.books || [];
  const totalBooks = booksResponse?.total || 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);

  const resetForm = () => {
    setBookForm(EMPTY_FORM);
    setEditingBook(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (imageInputRef2.current) imageInputRef2.current.value = "";
    if (imageInputRef3.current) imageInputRef3.current.value = "";
  };

  const createBookMutation = useMutation({
    mutationFn: async (data: BookForm) => {
      const bookData = {
        title: data.title, author: data.author, isbn: data.isbn || "",
        categoryId: data.categoryIds[0] || null, categoryIds: data.categoryIds,
        subCategoryId: data.subCategoryId || null,
        description: data.description || "", condition: data.condition, binding: data.binding,
        price: data.price?.trim() ? parseFloat(data.price).toString() : "0",
        costPrice: data.costPrice?.trim() ? parseFloat(data.costPrice).toString() : null,
        stock: data.stock || 0, imageUrl: data.imageUrl || "",
        imageUrl2: data.imageUrl2 || "", imageUrl3: data.imageUrl3 || "",
        publishedYear: data.publishedYear || null, publisher: data.publisher || "",
        pages: data.pages || null, language: data.language || "English",
        edition: data.edition || "",
        weight: data.weight?.trim() ? parseFloat(data.weight).toString() : null,
        dimensions: data.dimensions || "",
        featured: data.featured, bestseller: data.bestseller, trending: data.trending,
        newArrival: data.newArrival, boxSet: data.boxSet,
      };
      return apiRequest("POST", "/api/books", bookData);
    },
    onSuccess: () => {
      toast({ title: "Book added!", description: "Book created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: BookForm) => {
      if (!editingBook) throw new Error("No book selected");
      const bookData = {
        title: data.title, author: data.author, isbn: data.isbn || "",
        categoryId: data.categoryIds[0] || null, categoryIds: data.categoryIds,
        subCategoryId: data.subCategoryId || null,
        description: data.description || "", condition: data.condition, binding: data.binding,
        price: data.price?.trim() ? parseFloat(data.price).toString() : "0",
        costPrice: data.costPrice?.trim() ? parseFloat(data.costPrice).toString() : null,
        stock: data.stock || 0, imageUrl: data.imageUrl || "",
        imageUrl2: data.imageUrl2 || "", imageUrl3: data.imageUrl3 || "",
        publishedYear: data.publishedYear || null, publisher: data.publisher || "",
        pages: data.pages || null, language: data.language || "English",
        edition: data.edition || "",
        weight: data.weight?.trim() ? parseFloat(data.weight).toString() : null,
        dimensions: data.dimensions || "",
        featured: data.featured, bestseller: data.bestseller, trending: data.trending,
        newArrival: data.newArrival, boxSet: data.boxSet,
      };
      return apiRequest("PUT", `/api/books/${editingBook.id}`, bookData);
    },
    onSuccess: () => {
      toast({ title: "Updated!", description: "Book updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false); setEditingBook(null); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => { setDeletingBookId(id); return apiRequest("DELETE", `/api/books/${id}`); },
    onSuccess: async () => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsRefreshing(false); setDeletingBookId(null);
      toast({ title: "Deleted", description: "Book removed from inventory." });
    },
    onError: (e: Error) => { setDeletingBookId(null); toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("PATCH", `/api/books/${id}/visibility`),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || "", author: book.author || "", isbn: book.isbn || "",
      categoryIds: book.categories?.map(c => c.id) ?? (book.categoryId ? [book.categoryId] : []),
      subCategoryId: book.subCategoryId ?? null,
      description: book.description || "", condition: book.condition || "Good",
      binding: book.binding || "Softcover", price: book.price?.toString() || "", costPrice: book.costPrice?.toString() || "",
      stock: book.stock || 1, imageUrl: book.imageUrl || "",
      imageUrl2: book.imageUrl2 || "", imageUrl3: book.imageUrl3 || "",
      publishedYear: book.publishedYear || null, publisher: book.publisher || "",
      pages: book.pages || null, language: book.language || "English",
      edition: book.edition || "", weight: book.weight || "", dimensions: book.dimensions || "",
      featured: book.featured || false, bestseller: book.bestseller || false,
      trending: book.trending || false, newArrival: book.newArrival || false, boxSet: book.boxSet || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) return toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
    if (!bookForm.author.trim()) return toast({ title: "Validation Error", description: "Author is required", variant: "destructive" });
    if (bookForm.price?.trim() && (isNaN(parseFloat(bookForm.price)) || parseFloat(bookForm.price) < 0))
      return toast({ title: "Validation Error", description: "Price must be a positive number", variant: "destructive" });
    editingBook ? updateBookMutation.mutate(bookForm) : createBookMutation.mutate(bookForm);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "imageUrl" | "imageUrl2" | "imageUrl3") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
    if (file.size > 5 * 1024 * 1024) return toast({ title: "Too Large", description: "Max 5MB per image", variant: "destructive" });
    const setLoading = field === "imageUrl" ? setIsImageUploading : field === "imageUrl2" ? setIsImageUploading2 : setIsImageUploading3;
    setLoading(true);
    const fd = new FormData(); fd.append("image", file);
    try {
      const res = await fetch("/api/books/upload-image", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const result = await res.json();
      setBookForm(prev => ({ ...prev, [field]: result.imageUrl }));
      toast({ title: "Uploaded!", description: "Image uploaded successfully." });
    } catch (err) {
      toast({ title: "Upload Failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = ''; // reset so the same file can be re-selected
    setIsUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/admin/import-books", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const results = await res.json();
      setImportResults(results);
      toast({ title: "Import Complete", description: `${results.success} books processed (${results.created ?? results.success} created, ${results.updated ?? 0} updated)` });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    } catch (err) {
      toast({ title: "Import Failed", description: err instanceof Error ? err.message : "Import failed", variant: "destructive" });
    } finally { setIsUploading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/books/template", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download template");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "book_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Download Failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const exportBooks = async () => {
    try {
      const res = await fetch("/api/admin/books/export", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = `books_export_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Books exported successfully." });
    } catch (err) {
      toast({ title: "Export Failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const migrateImages = async () => {
    setIsMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate-images", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(`Migration failed: ${res.status}`);
      const result = await res.json();
      toast({ title: "Migration Complete", description: `${result.migratedCount} images migrated. ${result.errorCount} errors.` });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    } catch (err) {
      toast({ title: "Migration Failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally { setIsMigrating(false); }
  };

  const activeFiltersCount = [selectedCategory, selectedCondition, selectedBinding, stockFilter, minPrice, maxPrice, selectedTag].filter(Boolean).length;

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      // Name/Author default to A→Z (asc), dates default to newest first (desc), price/stock default to low→high (asc)
      const ascFields = ["title", "author", "price", "stock"];
      setSortOrder(ascFields.includes(field) ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">

      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(188,100%,22%) 0%, hsl(188,79%,35%) 60%, hsl(188,100%,29%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/[0.06]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          
            <h1 className="text-2xl sm:text-3xl font-bold">Inventory Management</h1>
            <p className="text-white/70 mt-1 text-sm">
              {totalBooks > 0 ? `${totalBooks} books in catalogue` : "Manage your book catalogue"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors">
              <FileText className="h-3.5 w-3.5" /> Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors disabled:opacity-50">
              <Upload className="h-3.5 w-3.5" /> {isUploading ? "Importing…" : "Import"}
            </button>
            <button onClick={exportBooks} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button onClick={migrateImages} disabled={isMigrating} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors disabled:opacity-50">
              <CloudUpload className="h-3.5 w-3.5" /> {isMigrating ? "Migrating…" : "Migrate"}
            </button>
            <button onClick={() => setIsBannerDialogOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors">
              <ImageIcon className="h-3.5 w-3.5" /> Banners
            </button>
            <button
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-primary-aqua text-sm font-bold hover:bg-white/95 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Book
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />

      {/* ── Search & Filter Bar ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + Filter toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-black" />
                <Input
                  placeholder="Search by title, author, or ISBN…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-9 bg-gray-50 border-gray-100 focus:bg-white"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-black hover:text-base-black">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? "bg-primary-aqua text-white border-primary-aqua" : "border-gray-200 text-secondary-black hover:border-primary-aqua hover:text-primary-aqua"}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters {activeFiltersCount > 0 && <span className="bg-amber-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{activeFiltersCount}</span>}
              </button>
            </div>

            {/* Row 2: Sort buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-secondary-black font-medium mr-1">Sort:</span>
              {[
                { field: "updatedAt", label: "Recent" },
                { field: "title", label: "Name" },
                { field: "price", label: "Price" },
                { field: "stock", label: "Stock" },
                { field: "author", label: "Author" },
                { field: "createdAt", label: "Date Added" },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSortChange(field)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    sortBy === field
                      ? "bg-primary-aqua text-white shadow-sm"
                      : "bg-gray-100 text-secondary-black hover:bg-gray-200"
                  }`}
                >
                  {label}
                  <SortIcon field={field} />
                </button>
              ))}
            </div>

            {/* Row 3: Expanded filters (collapsible) */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                <Select value={selectedCategory || undefined} onValueChange={v => { setSelectedCategory(v === "all" ? "" : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-40 bg-gray-50 border-gray-100 h-9 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedCondition || undefined} onValueChange={v => { setSelectedCondition(v === "all" ? "" : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-36 bg-gray-50 border-gray-100 h-9 text-xs">
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

                <Select value={selectedBinding || undefined} onValueChange={v => { setSelectedBinding(v === "all" ? "" : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-36 bg-gray-50 border-gray-100 h-9 text-xs">
                    <SelectValue placeholder="All Bindings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bindings</SelectItem>
                    <SelectItem value="Softcover">Softcover</SelectItem>
                    <SelectItem value="Hardcover">Hardcover</SelectItem>
                    <SelectItem value="Spiral">Spiral</SelectItem>
                    <SelectItem value="Board Book">Board Book</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter || undefined} onValueChange={v => { setStockFilter(v === "all" ? "" : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-36 bg-gray-50 border-gray-100 h-9 text-xs">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="inStock">In Stock</SelectItem>
                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedTag || undefined} onValueChange={v => { setSelectedTag(v === "all" ? "" : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-40 bg-gray-50 border-gray-100 h-9 text-xs">
                    <SelectValue placeholder="All Labels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    <SelectItem value="bestseller">🔥 Bestseller</SelectItem>
                    <SelectItem value="newArrival">✨ New Arrival</SelectItem>
                    <SelectItem value="trending">📈 Trending</SelectItem>
                    <SelectItem value="featured">⭐ Featured</SelectItem>
                    <SelectItem value="boxSet">📦 Box Set</SelectItem>
                  </SelectContent>
                </Select>

                {/* Price range */}
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }}
                    className="w-20 h-9 text-xs bg-gray-50 border-gray-100"
                    min="0"
                  />
                  <span className="text-xs text-secondary-black">–</span>
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                    className="w-20 h-9 text-xs bg-gray-50 border-gray-100"
                    min="0"
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setSelectedCategory(""); setSelectedCondition(""); setSelectedBinding(""); setStockFilter(""); setMinPrice(""); setMaxPrice(""); setSelectedTag(""); setCurrentPage(1); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    <X className="h-3 w-3" /> Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Book List ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-0 px-5 pt-5 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-3xl">
            
            Books
            <span className="text-xs font-normal text-secondary-black bg-gray-100 px-2 py-0.5 rounded-full">{totalBooks}</span>
          </CardTitle>
          <button
            onClick={() => { setIsRefreshing(true); queryClient.invalidateQueries({ queryKey: ["/api/books"] }).then(() => setIsRefreshing(false)); }}
            className="flex items-center gap-1.5 text-xs text-secondary-black hover:text-primary-aqua transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          {error ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">Failed to load books</h3>
              <p className="text-secondary-black text-sm mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          ) : isLoading || isRefreshing ? (
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-4 animate-pulse">
                  <div className="w-12 h-16 bg-gray-100 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="flex gap-2">
                      <div className="h-5 w-14 bg-gray-100 rounded-full" />
                      <div className="h-5 w-20 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {books.map((book, idx) => (
                <div
                  key={book.id}
                  className={`group flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors ${book.isHidden ? "opacity-50" : ""}`}
                >
                  {/* Rank */}
                  <span className="hidden sm:flex w-6 text-xs font-semibold text-secondary-black/50 shrink-0 tabular-nums">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </span>

                  {/* Cover */}
                  <div className="w-11 h-16 shrink-0 rounded-lg overflow-hidden shadow-sm bg-gray-100">
                    {book.imageUrl ? (
                      <img
                        src={getImageSrc(book.imageUrl)}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={e => { const t = e.target as HTMLImageElement; if (!t.src.includes("placeholder")) t.src = "https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="font-semibold text-sm text-base-black truncate leading-tight max-w-xs">{book.title}</h3>
                          </TooltipTrigger>
                          <TooltipContent side="top">{book.title}</TooltipContent>
                        </Tooltip>
                        <p className="text-xs text-secondary-black mt-0.5">{book.author}</p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* Condition */}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CONDITION_STYLES[book.condition] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {book.condition}
                          </span>

                          {/* Categories */}
                          {(book.categories?.length ? book.categories : book.category ? [book.category] : []).map(cat => (
                            <span key={cat.id} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 font-medium">
                              {cat.name}
                            </span>
                          ))}

                          {/* Binding */}
                          {book.binding && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{book.binding}</span>
                          )}

                          {/* Flags */}
                          {book.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">⭐ Featured</span>}
                          {book.bestseller && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">🔥 Bestseller</span>}
                          {book.newArrival && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✨ New</span>}
                        </div>
                      </div>

                      {/* Price + Stock + Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          {book.costPrice && parseFloat(book.costPrice) > parseFloat(book.price) && (
                            <p className="text-[10px] text-gray-400 line-through">${parseFloat(book.costPrice).toFixed(2)}</p>
                          )}
                          <p className="font-bold text-sm text-primary-aqua">${book.price}</p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${book.stock === 0 ? "text-red-500" : book.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                            {book.stock === 0 ? "Out of stock" : `${book.stock} in stock`}
                          </p>
                          {book.isHidden && (
                            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Hidden</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleVisibilityMutation.mutate(book.id)}
                            title={book.isHidden ? "Unhide listing" : "Hide listing"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${book.isHidden ? "border-amber-300 text-amber-500 bg-amber-50 hover:bg-amber-100" : "border-gray-200 text-secondary-black hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50"}`}
                          >
                            {book.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleEdit(book)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-secondary-black hover:border-primary-aqua hover:text-primary-aqua hover:bg-cyan-50 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBookMutation.mutate(book.id)}
                            disabled={deletingBookId === book.id || isRefreshing}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-secondary-black hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {deletingBookId === book.id
                              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <BookOpen className="h-10 w-10 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-base-black mb-2">No books found</h3>
              <p className="text-sm text-secondary-black mb-6 max-w-xs mx-auto">
                {search || selectedCategory || selectedCondition
                  ? "No books match your current filters. Try adjusting or clearing them."
                  : "Start building your catalogue by adding your first book."}
              </p>
              <button
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-aqua text-white text-sm font-semibold hover:bg-secondary-aqua transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add First Book
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 items-center justify-center px-5 py-4 border-t border-gray-50">
              {/* <span className="text-xs text-secondary-black">
                Page {currentPage} of {totalPages} · {totalBooks} books
              </span> */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-secondary-black hover:border-primary-aqua hover:text-primary-aqua disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const p = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-full text-xs font-semibold border transition-all ${currentPage === p ? "bg-primary-aqua text-white border-primary-aqua" : "border-gray-200 text-secondary-black hover:border-primary-aqua hover:text-primary-aqua"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-secondary-black hover:border-primary-aqua hover:text-primary-aqua disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add/Edit Book Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" onInteractOutside={e => e.preventDefault()}>
          {/* Dialog Header */}
          <div
            className="sticky top-0 z-10 px-6 py-4 border-b"
            style={{ background: "linear-gradient(135deg, hsl(188,100%,22%) 0%, hsl(188,79%,35%) 100%)" }}
          >
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">
                {editingBook ? `Edit: ${editingBook.title}` : "Add New Book"}
              </DialogTitle>
              <p className="text-white/70 text-xs mt-0.5">
                {editingBook ? "Update book details in your inventory" : "Fill in the details to add a new book"}
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Core Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="title" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Title *</Label>
                <Input id="title" value={bookForm.title} onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} required className="mt-1" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="author" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Author *</Label>
                <Input id="author" value={bookForm.author} onChange={e => setBookForm(p => ({ ...p, author: e.target.value }))} required className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="isbn" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">
                  ISBN <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="isbn"
                    value={bookForm.isbn}
                    onChange={e => setBookForm(p => ({ ...p, isbn: e.target.value }))}
                    placeholder="e.g. 9780743273565"
                    className={`pr-8 ${
                      isbnStatus === 'valid' ? 'border-green-500 focus-visible:ring-green-400' :
                      isbnStatus === 'invalid' || isbnStatus === 'duplicate' ? 'border-red-500 focus-visible:ring-red-400' :
                      ''
                    }`}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {isbnStatus === 'checking' && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                    {isbnStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {(isbnStatus === 'invalid' || isbnStatus === 'duplicate') && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                {isbnStatus === 'invalid' && (
                  <p className="mt-1 text-xs text-red-500">Invalid ISBN — must be 10 or 13 digits</p>
                )}
                {isbnStatus === 'duplicate' && (
                  <p className="mt-1 text-xs text-red-500">This ISBN already exists in the catalogue</p>
                )}
                {isbnStatus === 'valid' && (
                  <p className="mt-1 text-xs text-green-600">ISBN is valid and available</p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Categories</Label>
                <div className="mt-1 flex gap-2 items-start">
                  <div className="flex-1" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(v => !v)}
                      className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-transparent hover:bg-muted/30"
                    >
                      <span className="text-muted-foreground">{bookForm.categoryIds.length === 0 ? "Select…" : `${bookForm.categoryIds.length} selected`}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryDropdownOpen && (
                      <div className="absolute z-50 border rounded-md bg-background shadow-md mt-1 max-h-48 overflow-y-auto min-w-[200px]">
                        {categories.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-3 py-2">No categories yet</p>
                        ) : categories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer" onClick={() => setBookForm(p => ({ ...p, categoryIds: p.categoryIds.includes(cat.id) ? p.categoryIds.filter(i => i !== cat.id) : [...p.categoryIds, cat.id] }))}>
                            <div className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${bookForm.categoryIds.includes(cat.id) ? "bg-primary border-primary" : "border-input"}`}>
                              {bookForm.categoryIds.includes(cat.id) && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span className="text-sm">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {bookForm.categoryIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bookForm.categoryIds.map(id => {
                          const cat = categories.find(c => c.id === id);
                          return cat ? (
                            <Badge key={id} variant="secondary" className="gap-1 pr-1 text-xs">
                              {cat.name}
                              <button type="button" onClick={() => setBookForm(p => ({ ...p, categoryIds: p.categoryIds.filter(i => i !== id) }))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Subcategory */}
              <div>
                <Label className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Subcategory</Label>
                <div className="mt-1">
                  <Select
                    value={bookForm.subCategoryId ? String(bookForm.subCategoryId) : "none"}
                    onValueChange={v => setBookForm(p => ({ ...p, subCategoryId: v === "none" ? null : Number(v) }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {allSubCategories
                        .filter(s => bookForm.categoryIds.length === 0 || bookForm.categoryIds.includes(s.categoryId))
                        .map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Description</Label>
              <Textarea id="description" value={bookForm.description} onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" />
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <Label htmlFor="condition" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Condition *</Label>
                <select id="condition" value={bookForm.condition} onChange={e => setBookForm(p => ({ ...p, condition: e.target.value }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm" required>
                  <option value="">Select…</option>
                  {["New","Like New","Very Good","Good","Acceptable"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="binding" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Binding</Label>
                <select id="binding" value={bookForm.binding} onChange={e => setBookForm(p => ({ ...p, binding: e.target.value }))} className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm">
                  <option value="">Select…</option>
                  {["Hardcover","Softcover","No Binding","Spiral"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="price" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Selling Price ($) *</Label>
                <Input id="price" type="number" step="0.01" min="0" value={bookForm.price} onChange={e => setBookForm(p => ({ ...p, price: e.target.value }))} required className="mt-1 bg-white" />
              </div>
              <div>
                <Label htmlFor="costPrice" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Cost Price ($)</Label>
                <Input id="costPrice" type="number" step="0.01" min="0" placeholder="Original / MRP" value={bookForm.costPrice} onChange={e => setBookForm(p => ({ ...p, costPrice: e.target.value }))} className="mt-1 bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Stock *</Label>
                <Input id="stock" type="number" min="0" value={bookForm.stock} onChange={e => setBookForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="publishedYear" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Year</Label>
                <Input id="publishedYear" type="number" min="1000" max={new Date().getFullYear()} value={bookForm.publishedYear || ""} onChange={e => setBookForm(p => ({ ...p, publishedYear: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="publisher" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Publisher</Label>
                <Input id="publisher" value={bookForm.publisher} onChange={e => setBookForm(p => ({ ...p, publisher: e.target.value }))} className="mt-1" />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Book Images (up to 3)</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["imageUrl", "imageUrl2", "imageUrl3"] as const).map((field, i) => {
                  const labels = ["Primary", "Secondary", "Third"];
                  const loadingStates = [isImageUploading, isImageUploading2, isImageUploading3];
                  const refs = [imageInputRef, imageInputRef2, imageInputRef3];
                  return (
                    <div key={field} className="space-y-2">
                      <p className="text-xs text-secondary-black font-medium">{labels[i]}{i === 0 ? " *" : " (opt.)"}</p>
                      <div
                        className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden hover:border-primary-aqua/50 transition-colors cursor-pointer group"
                        onClick={() => refs[i].current?.click()}
                      >
                        {bookForm[field] ? (
                          <>
                            <img src={getImageSrc(bookForm[field])} alt={`Image ${i + 1}`} className="w-full h-full object-cover" onError={e => { const t = e.target as HTMLImageElement; if (!t.src.includes("placeholder")) t.src = "https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image"; }} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            {loadingStates[i] ? <RefreshCw className="h-5 w-5 text-primary-aqua animate-spin" /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
                            <p className="text-[10px] text-secondary-black">{loadingStates[i] ? "Uploading…" : "Click to upload"}</p>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={bookForm[field]}
                        onChange={e => setBookForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder="or paste URL"
                        className="text-xs h-8"
                      />
                      <input ref={refs[i]} type="file" accept="image/*" onChange={e => handleImageUpload(e, field)} className="hidden" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pages" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Pages</Label>
                <Input id="pages" type="number" value={bookForm.pages || ""} onChange={e => setBookForm(p => ({ ...p, pages: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="language" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Language</Label>
                <Input id="language" value={bookForm.language} onChange={e => setBookForm(p => ({ ...p, language: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edition" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Edition</Label>
                <Input id="edition" value={bookForm.edition} onChange={e => setBookForm(p => ({ ...p, edition: e.target.value }))} placeholder="1st Edition" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Weight (lbs)</Label>
                <Input id="weight" value={bookForm.weight} onChange={e => setBookForm(p => ({ ...p, weight: e.target.value }))} placeholder="1.2" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dimensions" className="text-xs font-semibold text-secondary-black uppercase tracking-wide">Dimensions</Label>
                <Input id="dimensions" value={bookForm.dimensions} onChange={e => setBookForm(p => ({ ...p, dimensions: e.target.value }))} placeholder="8x5x1" className="mt-1" />
              </div>
            </div>

            {/* Feature Flags */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">Feature Badges</p>
              <div className="grid grid-cols-5 gap-3">
                {([
                  { id: "featured", label: "⭐ Featured" },
                  { id: "bestseller", label: "🔥 Bestseller" },
                  { id: "trending", label: "📈 Trending" },
                  { id: "newArrival", label: "✨ New Arrival" },
                  { id: "boxSet", label: "📦 Box Set" },
                ] as { id: keyof Pick<BookForm, "featured"|"bestseller"|"trending"|"newArrival"|"boxSet">; label: string }[]).map(({ id, label }) => (
                  <label key={id} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 cursor-pointer transition-all text-center ${bookForm[id] ? "border-amber-400 bg-amber-100" : "border-transparent bg-white hover:border-amber-200"}`}>
                    <Checkbox id={id} checked={bookForm[id]} onCheckedChange={v => setBookForm(p => ({ ...p, [id]: v as boolean }))} className="hidden" />
                    <span className="text-sm">{label.split(" ")[0]}</span>
                    <span className="text-[10px] font-medium text-secondary-black leading-tight">{label.split(" ").slice(1).join(" ")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={
                  createBookMutation.isPending || updateBookMutation.isPending ||
                  (!editingBook && isbnStatus !== 'valid') ||
                  (!!editingBook && bookForm.isbn.trim() !== '' && (isbnStatus === 'invalid' || isbnStatus === 'duplicate' || isbnStatus === 'checking'))
                }
                className="rounded-full bg-primary-aqua hover:bg-secondary-aqua px-6"
              >
                {createBookMutation.isPending || updateBookMutation.isPending
                  ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                  : editingBook ? "Update Book" : "Add Book"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={e => e.preventDefault()}>
          <BannerUploadPage />
        </DialogContent>
      </Dialog>

    </div>
  );
}


