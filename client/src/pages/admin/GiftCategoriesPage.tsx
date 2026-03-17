import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Gift, Upload, X, ImagePlus, BookOpen, BookMarked, Pen, Hash, DollarSign, AlignLeft, ChevronRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GiftCategory } from "../../../../shared/schema";

interface CategoryForm {
  name: string;
  type: "novel" | "notebook" | "";
  description: string;
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  isEngravingAllowed: boolean;
  engravingCharacterLimit: number | "";
}

export default function GiftCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GiftCategory | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImage2, setUploadedImage2] = useState<File | null>(null);
  const [uploadedImage3, setUploadedImage3] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreview2, setImagePreview2] = useState<string>('');
  const [imagePreview3, setImagePreview3] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gift categories
  const { data: categories = [], isLoading } = useQuery<GiftCategory[]>({
    queryKey: ["/api/admin/gift-categories"],
  });

  // Form state
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    type: "novel",
    description: "",
    imageUrl: "",
    imageUrl2: "",
    imageUrl3: "",
    price: 0,
    isActive: true,
    sortOrder: 0,
    isEngravingAllowed: false,
    engravingCharacterLimit: "",
  });

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      if (editingCategory) {
        return apiRequest('PUT', `/api/admin/gift-categories/${editingCategory.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/gift-categories', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-categories"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingCategory ? 'update' : 'create'} category`,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/gift-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      type: "novel",
      description: "",
      imageUrl: "",
      imageUrl2: "",
      imageUrl3: "",
      price: 0,
      isActive: true,
      sortOrder: 0,
      isEngravingAllowed: false,
      engravingCharacterLimit: "",
    });
    setEditingCategory(null);
    setUploadedImage(null);
    setUploadedImage2(null);
    setUploadedImage3(null);
    setImagePreview('');
    setImagePreview2('');
    setImagePreview3('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (fileInputRef2.current) fileInputRef2.current.value = '';
    if (fileInputRef3.current) fileInputRef3.current.value = '';
  };

  const handleEdit = (category: GiftCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      type: category.type as "novel" | "notebook",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      imageUrl2: category.imageUrl2 || "",
      imageUrl3: category.imageUrl3 || "",
      price: Number(category.price) || 0,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      isEngravingAllowed: category.isEngravingAllowed ?? false,
      engravingCharacterLimit: category.engravingCharacterLimit ?? "",
    });
    setImagePreview(category.imageUrl || '');
    setImagePreview2(category.imageUrl2 || '');
    setImagePreview3(category.imageUrl3 || '');
    setUploadedImage(null);
    setUploadedImage2(null);
    setUploadedImage3(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category? All gift items in this category will also be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 500KB for better performance)
      if (file.size > 500 * 1024) {
        toast({
          title: "Error", 
          description: "Image file is too large. Please choose a file smaller than 500KB.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setForm({ ...form, imageUrl: '' }); // Clear URL when file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast({
          title: "Error", 
          description: "Image file is too large. Please choose a file smaller than 500KB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedImage2(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview2(result);
        setForm({ ...form, imageUrl2: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast({
          title: "Error", 
          description: "Image file is too large. Please choose a file smaller than 500KB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedImage3(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview3(result);
        setForm({ ...form, imageUrl3: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview('');
    setForm({ ...form, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage2 = () => {
    setUploadedImage2(null);
    setImagePreview2('');
    setForm({ ...form, imageUrl2: '' });
    if (fileInputRef2.current) {
      fileInputRef2.current.value = '';
    }
  };

  const clearImage3 = () => {
    setUploadedImage3(null);
    setImagePreview3('');
    setForm({ ...form, imageUrl3: '' });
    if (fileInputRef3.current) {
      fileInputRef3.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finalForm = { 
        ...form
      };
      
      // Process images concurrently
      const processImage = (file: File | null, imageUrl: string) => {
        return new Promise<string>((resolve, reject) => {
          if (!file) {
            resolve(imageUrl);
            return;
          }
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            const maxSize = 400;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedImage);
          };
          
          img.onerror = () => reject(new Error('Failed to process image'));
          
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };
      
      // Process all images
      const [processedImage1, processedImage2, processedImage3] = await Promise.all([
        processImage(uploadedImage, finalForm.imageUrl),
        processImage(uploadedImage2, finalForm.imageUrl2),
        processImage(uploadedImage3, finalForm.imageUrl3)
      ]);
      
      finalForm.imageUrl = processedImage1;
      finalForm.imageUrl2 = processedImage2;
      finalForm.imageUrl3 = processedImage3;
      
      console.log('Submitting form with processed images');
      categoryMutation.mutate(finalForm);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const activeCount = categories.filter(c => c.isActive).length;
  const novelCount = categories.filter(c => c.type === 'novel').length;
  const notebookCount = categories.filter(c => c.type === 'notebook').length;

  const ImageUploadZone = ({
    preview,
    label,
    inputRef,
    onUpload,
    onClear,
    required,
  }: {
    preview: string;
    label: string;
    inputRef: React.RefObject<HTMLInputElement>;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    required?: boolean;
  }) => (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${preview
            ? "border-transparent"
            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 bg-gray-50/60"
          }`}
        style={{ minHeight: "7.5rem" }}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-[7.5rem] object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Change
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-0.5 shadow-sm transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[7.5rem] gap-1.5">
            <ImagePlus className="w-6 h-6 text-gray-300" />
            <span className="text-xs text-gray-400">Click to upload</span>
            {!required && <span className="text-[10px] text-gray-300">Optional</span>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Gift Categories</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage categories like Classic Novel, Mystery Novel, Premium Notebook&hellip;
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>

            {/* ── Dialog ── */}
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0 gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-indigo-600" />
                  </span>
                  {editingCategory ? "Edit Gift Category" : "New Gift Category"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Name + Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Category Name <span className="text-red-400">*</span></Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Classic Novel"
                      required
                      className="rounded-lg border-gray-200 focus-visible:ring-indigo-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Type <span className="text-red-400">*</span></Label>
                    <div className="flex gap-2">
                      {(["novel", "notebook"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, type: t })}
                          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all duration-150
                            ${form.type === t
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                        >
                          {t === "novel" ? <BookOpen className="w-4 h-4" /> : <BookMarked className="w-4 h-4" />}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-gray-400" /> Description
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this category…"
                    rows={2}
                    className="rounded-lg border-gray-200 focus-visible:ring-indigo-400 resize-none text-sm"
                  />
                </div>

                {/* Price + Sort Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="rounded-lg border-gray-200 focus-visible:ring-indigo-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-gray-400" /> Sort Order
                    </Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="rounded-lg border-gray-200 focus-visible:ring-indigo-400 h-10"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5 text-gray-400" /> Category Images
                    <span className="text-xs font-normal text-gray-400 ml-1">max 500 KB each</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <ImageUploadZone
                      preview={imagePreview}
                      label="Image 1"
                      inputRef={fileInputRef}
                      onUpload={handleImageUpload}
                      onClear={clearImage}
                      required
                    />
                    <ImageUploadZone
                      preview={imagePreview2}
                      label="Image 2"
                      inputRef={fileInputRef2}
                      onUpload={handleImageUpload2}
                      onClear={clearImage2}
                    />
                    <ImageUploadZone
                      preview={imagePreview3}
                      label="Image 3"
                      inputRef={fileInputRef3}
                      onUpload={handleImageUpload3}
                      onClear={clearImage3}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Active</p>
                      <p className="text-xs text-gray-400">Show this category on the storefront</p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Pen className="w-3.5 h-3.5 text-gray-400" /> Engraving Allowed
                      </p>
                      <p className="text-xs text-gray-400">Let customers personalize with engraving</p>
                    </div>
                    <Switch
                      id="isEngravingAllowed"
                      checked={form.isEngravingAllowed}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, isEngravingAllowed: checked, engravingCharacterLimit: checked ? form.engravingCharacterLimit : "" })
                      }
                    />
                  </div>
                  {form.isEngravingAllowed && (
                    <div className="px-4 py-3 space-y-1.5 bg-white">
                      <Label htmlFor="engravingCharacterLimit" className="text-sm font-medium text-gray-700">
                        Character Limit
                      </Label>
                      <Input
                        id="engravingCharacterLimit"
                        type="number"
                        min="1"
                        value={form.engravingCharacterLimit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm({ ...form, engravingCharacterLimit: val === "" ? "" : Number(val) });
                        }}
                        placeholder="e.g., 50"
                        className="max-w-[180px] rounded-lg border-gray-200 focus-visible:ring-indigo-400 h-9 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={categoryMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl h-10 font-medium shadow-sm"
                  >
                    {categoryMutation.isPending
                      ? "Saving…"
                      : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: "Total", value: categories.length, color: "bg-indigo-100 text-indigo-700" },
            { label: "Active", value: activeCount, color: "bg-emerald-100 text-emerald-700" },
            { label: "Novels", value: novelCount, color: "bg-violet-100 text-violet-700" },
            { label: "Notebooks", value: notebookCount, color: "bg-amber-100 text-amber-700" },
          ].map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}
            >
              {s.label}
              <span className="font-bold">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse space-y-3">
              <div className="h-36 rounded-xl bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No categories yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Create your first gift category to start organising your gift collection.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="w-12 h-12 text-gray-200" />
                  </div>
                )}

                {/* Type badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                    ${category.type === "novel"
                      ? "bg-violet-500/90 text-white"
                      : "bg-amber-500/90 text-white"
                    }`}>
                    {category.type === "novel" ? <BookOpen className="w-3 h-3" /> : <BookMarked className="w-3 h-3" />}
                    {category.type === "novel" ? "Novel" : "Notebook"}
                  </span>
                </div>

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                    ${category.isActive
                      ? "bg-emerald-500/90 text-white"
                      : "bg-gray-400/80 text-white"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? "bg-white" : "bg-gray-200"}`} />
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Extra images strip */}
                {(category.imageUrl2 || category.imageUrl3) && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {[category.imageUrl2, category.imageUrl3].map((url, idx) =>
                      url ? (
                        <img
                          key={idx}
                          src={url}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover border-2 border-white shadow-sm"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="flex flex-col flex-1 p-4">
                <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-1">{category.name}</h3>

                {category.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{category.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-gray-300" />
                    <span className="font-semibold text-gray-700">${Number(category.price || 0).toFixed(2)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-gray-300" />
                    Order <span className="font-semibold text-gray-700">{category.sortOrder}</span>
                  </span>
                  {category.isEngravingAllowed && (
                    <span className="flex items-center gap-1 text-indigo-500">
                      <Pen className="w-3 h-3" />
                      Engraving
                      {category.engravingCharacterLimit ? ` · ${category.engravingCharacterLimit} chars` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 pt-0 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(category)}
                  className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors h-8 text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(category.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors h-8 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}