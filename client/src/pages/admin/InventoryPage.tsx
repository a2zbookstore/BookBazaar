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
  FileText,
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 p-2 md:p-4">
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
