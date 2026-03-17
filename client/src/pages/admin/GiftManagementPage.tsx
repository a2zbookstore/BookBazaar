import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Gift, Settings, Upload, X, ImagePlus, BookOpen, BookMarked, DollarSign, Hash, AlignLeft, FileText, Barcode, LayoutTemplate, Sparkles, Eye, EyeOff, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GiftItem, HomepageContent, GiftCategory } from "@/shared/schema";

interface GiftForm {
  categoryId: number;
  name: string;
  type: "novel" | "notebook" | "";
  description: string;
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
  price: number;
  isbn: string;
  isActive: boolean;
  sortOrder: number;
}

interface ContentForm {
  section: string;
  title: string;
  subtitle: string;
  content: string;
  isActive: boolean;
  settings: string;
}

export default function GiftManagementPage() {
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [editingContent, setEditingContent] = useState<HomepageContent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Image upload refs and state
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef2 = useRef<HTMLInputElement>(null);
  const imageInputRef3 = useRef<HTMLInputElement>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageUploading2, setIsImageUploading2] = useState(false);
  const [isImageUploading3, setIsImageUploading3] = useState(false);

  // Image upload handlers
  const handleImageUpload = async (file: File, imageField: 'imageUrl' | 'imageUrl2' | 'imageUrl3') => {
    const setUploading = imageField === 'imageUrl' ? setIsImageUploading :
      imageField === 'imageUrl2' ? setIsImageUploading2 : setIsImageUploading3;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.success) {
        setGiftForm(prev => ({ ...prev, [imageField]: response.imageUrl }));
        toast({
          title: "Image uploaded successfully",
          description: `Image ${imageField === 'imageUrl' ? '1' : imageField === 'imageUrl2' ? '2' : '3'} has been uploaded.`,
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Fetch gift items
  const { data: giftItems = [], isLoading: giftLoading } = useQuery<GiftItem[]>({
    queryKey: ["/api/admin/gift-items"],
  });

  // Fetch homepage content
  const { data: homepageContent = [], isLoading: contentLoading } = useQuery<HomepageContent[]>({
    queryKey: ["/api/admin/homepage-content"],
  });

  // Fetch gift categories for dropdown
  const { data: categories = [] } = useQuery<GiftCategory[]>({
    queryKey: ["/api/admin/gift-categories"],
  });

  // Gift form state
  const [giftForm, setGiftForm] = useState<GiftForm>({
    categoryId: 0,
    name: "",
    type: "novel",
    description: "",
    imageUrl: "",
    imageUrl2: "",
    imageUrl3: "",
    price: 0,
    isbn: "",
    isActive: true,
    sortOrder: 0,
  });

  // Content form state
  const [contentForm, setContentForm] = useState<ContentForm>({
    section: "gift_offer",
    title: "",
    subtitle: "",
    content: "",
    isActive: true,
    settings: "{}",
  });

  // Create/Update gift mutation
  const giftMutation = useMutation({
    mutationFn: async (data: GiftForm) => {
      if (editingGift) {
        return apiRequest('PUT', `/api/admin/gift-items/${editingGift.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/gift-items', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-items"] });
      setIsGiftDialogOpen(false);
      resetGiftForm();
      toast({
        title: "Success",
        description: `Gift item ${editingGift ? 'updated' : 'created'} successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingGift ? 'update' : 'create'} gift item`,
        variant: "destructive",
      });
    },
  });

  // Create/Update content mutation
  const contentMutation = useMutation({
    mutationFn: async (data: ContentForm) => {
      if (editingContent) {
        return apiRequest('PUT', `/api/admin/homepage-content/${editingContent.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/homepage-content', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-content"] });
      setIsContentDialogOpen(false);
      resetContentForm();
      toast({
        title: "Success",
        description: `Content ${editingContent ? 'updated' : 'created'} successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingContent ? 'update' : 'create'} content`,
        variant: "destructive",
      });
    },
  });

  // Delete gift mutation
  const deleteGiftMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/gift-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-items"] });
      toast({
        title: "Success",
        description: "Gift item deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete gift item",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/homepage-content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-content"] });
      toast({
        title: "Success",
        description: "Content deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  const resetGiftForm = () => {
    setGiftForm({
      categoryId: categories.length > 0 ? categories[0].id : 0,
      name: "",
      type: "novel",
      description: "",
      imageUrl: "",
      imageUrl2: "",
      imageUrl3: "",
      price: 0,
      isbn: "",
      isActive: true,
      sortOrder: 0,
    });
    setEditingGift(null);
    // Reset file inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (imageInputRef2.current) imageInputRef2.current.value = '';
    if (imageInputRef3.current) imageInputRef3.current.value = '';
  };

  const resetContentForm = () => {
    setContentForm({
      section: "gift_offer",
      title: "",
      subtitle: "",
      content: "",
      isActive: true,
      settings: "{}",
    });
    setEditingContent(null);
  };

  const handleEditGift = (gift: GiftItem) => {
    setEditingGift(gift);
    setGiftForm({
      categoryId: gift.categoryId,
      name: gift.name,
      type: gift.type as "novel" | "notebook",
      description: gift.description || "",
      imageUrl: gift.imageUrl || "",
      imageUrl2: gift.imageUrl2 || "",
      imageUrl3: gift.imageUrl3 || "",
      price: parseFloat(gift.price || "0"),
      isbn: gift.isbn || "",
      isActive: gift.isActive,
      sortOrder: gift.sortOrder,
    });
    setIsGiftDialogOpen(true);
  };

  const handleEditContent = (content: HomepageContent) => {
    setEditingContent(content);
    setContentForm({
      section: content.section,
      title: content.title || "",
      subtitle: content.subtitle || "",
      content: content.content || "",
      isActive: content.isActive,
      settings: content.settings || "{}",
    });
    setIsContentDialogOpen(true);
  };

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    giftMutation.mutate(giftForm);
  };

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contentMutation.mutate(contentForm);
  };

  // ── Derived stats ──
  const activeGifts = giftItems.filter(g => g.isActive).length;
  const activeContent = homepageContent.filter(c => c.isActive).length;

  // ── Reusable image upload zone ──
  const ImageZone = ({
    preview,
    label,
    inputRef,
    onUpload,
    onClear,
    loading,
  }: {
    preview: string;
    label: string;
    inputRef: React.RefObject<HTMLInputElement>;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    loading?: boolean;
  }) => (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${preview ? "border-transparent" : "border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 bg-gray-50/60"}
          ${loading ? "opacity-60 cursor-wait" : ""}`}
        style={{ minHeight: "7.5rem" }}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-[7.5rem] object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Change</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-0.5 shadow-sm">
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[7.5rem] gap-1.5">
            {loading ? <div className="w-5 h-5 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" /> : <ImagePlus className="w-6 h-6 text-gray-300" />}
            <span className="text-xs text-gray-400">{loading ? "Uploading…" : "Click to upload"}</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 via-white to-orange-50 border border-rose-100 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-rose-100/50 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Gift Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage gift items &amp; homepage content for the Gift with Purchase feature</p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: "Gift Items", value: giftItems.length, color: "bg-rose-100 text-rose-700" },
            { label: "Active Gifts", value: activeGifts, color: "bg-emerald-100 text-emerald-700" },
            { label: "Content Sections", value: homepageContent.length, color: "bg-orange-100 text-orange-700" },
            { label: "Active Content", value: activeContent, color: "bg-sky-100 text-sky-700" },
          ].map((s) => (
            <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
              {s.label} <span className="font-bold">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="gifts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100/80 p-1 h-11">
          <TabsTrigger value="gifts"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Gift Items
          </TabsTrigger>
          <TabsTrigger value="content"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Homepage Content
          </TabsTrigger>
        </TabsList>

        {/* ════════ Gift Items Tab ════════ */}
        <TabsContent value="gifts" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Gift Items <span className="text-gray-400 font-normal">({giftItems.length})</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage the gift items available for customers</p>
            </div>
            <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetGiftForm}
                  className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Add Gift Item
                </Button>
              </DialogTrigger>

              {/* ── Gift Dialog ── */}
              <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-rose-600" />
                    </span>
                    {editingGift ? "Edit Gift Item" : "New Gift Item"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleGiftSubmit} className="px-6 py-5 space-y-5">
                  {/* Category + Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Category <span className="text-red-400">*</span></Label>
                      <select
                        value={giftForm.categoryId}
                        onChange={(e) => setGiftForm({ ...giftForm, categoryId: parseInt(e.target.value) })}
                        required
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="">Select category…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="giftName" className="text-sm font-medium text-gray-700">Name <span className="text-red-400">*</span></Label>
                      <Input id="giftName" value={giftForm.name}
                        onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                        placeholder="e.g., Classic Mystery Book" required
                        className="rounded-lg border-gray-200 focus-visible:ring-rose-400 h-10" />
                    </div>
                  </div>

                  {/* Type toggle */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Type</Label>
                    <div className="flex gap-2">
                      {(["novel", "notebook"] as const).map((t) => (
                        <button key={t} type="button"
                          onClick={() => setGiftForm({ ...giftForm, type: t })}
                          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-all duration-150
                            ${giftForm.type === t ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600"}`}>
                          {t === "novel" ? <BookOpen className="w-4 h-4" /> : <BookMarked className="w-4 h-4" />}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="giftDesc" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-gray-400" /> Description
                    </Label>
                    <Textarea id="giftDesc" value={giftForm.description}
                      onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                      placeholder="Brief description of the gift item…" rows={2}
                      className="rounded-lg border-gray-200 focus-visible:ring-rose-400 resize-none text-sm" />
                  </div>

                  {/* Images */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <ImagePlus className="w-3.5 h-3.5 text-gray-400" /> Images
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <ImageZone
                        preview={giftForm.imageUrl}
                        label="Image 1"
                        inputRef={imageInputRef}
                        loading={isImageUploading}
                        onUpload={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'imageUrl'); }}
                        onClear={() => setGiftForm(prev => ({ ...prev, imageUrl: "" }))}
                      />
                      <ImageZone
                        preview={giftForm.imageUrl2}
                        label="Image 2"
                        inputRef={imageInputRef2}
                        loading={isImageUploading2}
                        onUpload={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'imageUrl2'); }}
                        onClear={() => setGiftForm(prev => ({ ...prev, imageUrl2: "" }))}
                      />
                      <ImageZone
                        preview={giftForm.imageUrl3}
                        label="Image 3"
                        inputRef={imageInputRef3}
                        loading={isImageUploading3}
                        onUpload={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'imageUrl3'); }}
                        onClear={() => setGiftForm(prev => ({ ...prev, imageUrl3: "" }))}
                      />
                    </div>
                  </div>

                  {/* Price + ISBN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="giftPrice" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Price
                      </Label>
                      <Input id="giftPrice" type="number" step="0.01" min="0" value={giftForm.price}
                        onChange={(e) => setGiftForm({ ...giftForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00" className="rounded-lg border-gray-200 focus-visible:ring-rose-400 h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="giftIsbn" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-gray-400" /> ISBN
                      </Label>
                      <Input id="giftIsbn" value={giftForm.isbn}
                        onChange={(e) => setGiftForm({ ...giftForm, isbn: e.target.value })}
                        placeholder="978-0-123456-78-9" className="rounded-lg border-gray-200 focus-visible:ring-rose-400 h-10" />
                    </div>
                  </div>

                  {/* Sort Order + Active */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-gray-400" /> Sort Order
                        </p>
                        <p className="text-xs text-gray-400">Lower number appears first</p>
                      </div>
                      <Input type="number" value={giftForm.sortOrder}
                        onChange={(e) => setGiftForm({ ...giftForm, sortOrder: parseInt(e.target.value) || 0 })}
                        placeholder="0" className="w-20 rounded-lg border-gray-200 focus-visible:ring-rose-400 h-9 text-sm text-right" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Active</p>
                        <p className="text-xs text-gray-400">Show this item to customers</p>
                      </div>
                      <Switch id="giftActive" checked={giftForm.isActive}
                        onCheckedChange={(c) => setGiftForm({ ...giftForm, isActive: c })} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <Button type="submit" disabled={giftMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl h-10 font-medium shadow-sm">
                      {giftMutation.isPending ? "Saving…" : editingGift ? "Update Item" : "Create Item"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsGiftDialogOpen(false)}
                      className="rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Gift Items Grid ── */}
          {giftLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse space-y-3">
                  <div className="h-36 rounded-xl bg-gray-100" />
                  <div className="h-4 w-2/3 rounded bg-gray-100" />
                  <div className="h-3 w-full rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : giftItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-rose-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">No gift items yet</h3>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">Add your first gift item to make it available for customers.</p>
              <Button onClick={() => setIsGiftDialogOpen(true)}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl shadow-sm text-sm">
                <Plus className="w-4 h-4 mr-2" /> Add First Gift Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {giftItems.map((gift) => {
                const cat = categories.find(c => c.id === gift.categoryId);
                return (
                  <div key={gift.id}
                    className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {gift.imageUrl ? (
                        <img src={gift.imageUrl} alt={gift.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                          ${gift.type === "novel" ? "bg-violet-500/90 text-white" : "bg-amber-500/90 text-white"}`}>
                          {gift.type === "novel" ? <BookOpen className="w-3 h-3" /> : <BookMarked className="w-3 h-3" />}
                          {gift.type === "novel" ? "Novel" : "Notebook"}
                        </span>
                      </div>
                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                          ${gift.isActive ? "bg-emerald-500/90 text-white" : "bg-gray-400/80 text-white"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gift.isActive ? "bg-white" : "bg-gray-200"}`} />
                          {gift.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {/* Extra image thumbnails */}
                      {(gift.imageUrl2 || gift.imageUrl3) && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {[gift.imageUrl2, gift.imageUrl3].map((url, idx) =>
                            url ? <img key={idx} src={url} alt="" className="w-8 h-8 rounded-md object-cover border-2 border-white shadow-sm"
                              onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{gift.name}</h3>
                      {cat && <p className="text-xs text-rose-500 font-medium mt-0.5">{cat.name}</p>}
                      {gift.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{gift.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                        {gift.price && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-300" />
                            <span className="font-semibold text-gray-700">${parseFloat(gift.price).toFixed(2)}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-gray-300" />
                          Order <span className="font-semibold text-gray-700">{gift.sortOrder}</span>
                        </span>
                        {gift.isbn && (
                          <span className="flex items-center gap-1 truncate">
                            <Barcode className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            <span className="truncate">{gift.isbn}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-gray-300" />
                          {new Date(gift.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 pt-0 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditGift(gift)}
                        className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors h-8 text-xs">
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteGiftMutation.mutate(gift.id)}
                        disabled={deleteGiftMutation.isPending}
                        className="flex-1 rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors h-8 text-xs">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ════════ Homepage Content Tab ════════ */}
        <TabsContent value="content" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Content Sections <span className="text-gray-400 font-normal">({homepageContent.length})</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage content displayed on the homepage</p>
            </div>
            <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetContentForm}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Add Content Section
                </Button>
              </DialogTrigger>

              {/* ── Content Dialog ── */}
              <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                      <LayoutTemplate className="w-4 h-4 text-orange-600" />
                    </span>
                    {editingContent ? "Edit Content Section" : "New Content Section"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleContentSubmit} className="px-6 py-5 space-y-5">
                  {/* Section selector */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Section</Label>
                    <Select value={contentForm.section} onValueChange={(v) => setContentForm({ ...contentForm, section: v })} defaultValue="gift_offer">
                      <SelectTrigger className="rounded-lg border-gray-200 focus:ring-orange-400 h-10">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gift_offer">🎁 Gift Offer</SelectItem>
                        <SelectItem value="hero">🌟 Hero Section</SelectItem>
                        <SelectItem value="about">ℹ️ About Section</SelectItem>
                        <SelectItem value="featured">⭐ Featured Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title + Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contentTitle" className="text-sm font-medium text-gray-700">Title</Label>
                      <Input id="contentTitle" value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        placeholder="Section title" className="rounded-lg border-gray-200 focus-visible:ring-orange-400 h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contentSubtitle" className="text-sm font-medium text-gray-700">Subtitle</Label>
                      <Input id="contentSubtitle" value={contentForm.subtitle}
                        onChange={(e) => setContentForm({ ...contentForm, subtitle: e.target.value })}
                        placeholder="Section subtitle" className="rounded-lg border-gray-200 focus-visible:ring-orange-400 h-10" />
                    </div>
                  </div>

                  {/* Content body */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contentBody" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400" /> Content
                    </Label>
                    <Textarea id="contentBody" value={contentForm.content}
                      onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                      placeholder="Main content text…" rows={3}
                      className="rounded-lg border-gray-200 focus-visible:ring-orange-400 resize-none text-sm" />
                  </div>

                  {/* Settings JSON */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contentSettings" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-gray-400" /> Settings <span className="text-xs font-normal text-gray-400">(JSON)</span>
                    </Label>
                    <Textarea id="contentSettings" value={contentForm.settings}
                      onChange={(e) => setContentForm({ ...contentForm, settings: e.target.value })}
                      placeholder='{"color": "blue", "showIcon": true}' rows={2}
                      className="rounded-lg border-gray-200 focus-visible:ring-orange-400 resize-none text-sm font-mono" />
                  </div>

                  {/* Active toggle */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Active</p>
                        <p className="text-xs text-gray-400">Display this section on the homepage</p>
                      </div>
                      <Switch id="contentActive" checked={contentForm.isActive}
                        onCheckedChange={(c) => setContentForm({ ...contentForm, isActive: c })} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <Button type="submit" disabled={contentMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl h-10 font-medium shadow-sm">
                      {contentMutation.isPending ? "Saving…" : editingContent ? "Update Section" : "Create Section"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsContentDialogOpen(false)}
                      className="rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Content list ── */}
          {contentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : homepageContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                <LayoutTemplate className="w-7 h-7 text-orange-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">No content sections yet</h3>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">Create homepage content sections to control what customers see.</p>
              <Button onClick={() => setIsContentDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-sm text-sm">
                <Plus className="w-4 h-4 mr-2" /> Add First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {homepageContent.map((content) => (
                <div key={content.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Section icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-orange-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 capitalize">
                        {content.section.replace(/_/g, " ")}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${content.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {content.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {content.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{content.title || <span className="text-gray-400 font-normal italic">No title</span>}</p>
                    {content.subtitle && <p className="text-xs text-gray-400 truncate">{content.subtitle}</p>}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Updated {new Date(content.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEditContent(content)}
                      className="rounded-xl border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors h-8 text-xs px-3">
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteContentMutation.mutate(content.id)}
                      disabled={deleteContentMutation.isPending}
                      className="rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors h-8 text-xs px-3">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}