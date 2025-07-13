import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, GripVertical, Gift, Settings, Eye, Upload, X } from "lucide-react";
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage gift items and homepage content for the Gift with Purchase feature
        </p>
      </div>

      <Tabs defaultValue="gifts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gifts" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Gift Items
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Homepage Content
          </TabsTrigger>
        </TabsList>

        {/* Gift Items Tab */}
        <TabsContent value="gifts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Gift Items ({giftItems.length})</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage the gift items available for customers
              </p>
            </div>
            <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetGiftForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gift Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingGift ? 'Edit Gift Item' : 'Add New Gift Item'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGiftSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryId">Category</Label>
                      <select
                        id="categoryId"
                        value={giftForm.categoryId}
                        onChange={(e) => setGiftForm({ ...giftForm, categoryId: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={giftForm.name}
                        onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                        placeholder="e.g., Classic Mystery Book"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <select
                        id="type"
                        value={giftForm.type}
                        onChange={(e) => setGiftForm({ ...giftForm, type: e.target.value as "novel" | "notebook" })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="novel">Novel</option>
                        <option value="notebook">Notebook</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={giftForm.description}
                      onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                      placeholder="Brief description of the gift item"
                      rows={3}
                    />
                  </div>
                  
                  {/* Image Upload Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Image 1 */}
                    <div className="space-y-2">
                      <Label>Image 1</Label>
                      <div className="flex flex-col space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isImageUploading}
                          className="w-full"
                        >
                          {isImageUploading ? "Uploading..." : "Upload Image 1"}
                          <Upload className="ml-2 h-4 w-4" />
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, 'imageUrl');
                            }
                          }}
                          className="hidden"
                        />
                        {giftForm.imageUrl && (
                          <div className="relative">
                            <img 
                              src={giftForm.imageUrl} 
                              alt="Preview 1" 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setGiftForm(prev => ({ ...prev, imageUrl: "" }))}
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image 2 */}
                    <div className="space-y-2">
                      <Label>Image 2 (Optional)</Label>
                      <div className="flex flex-col space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef2.current?.click()}
                          disabled={isImageUploading2}
                          className="w-full"
                        >
                          {isImageUploading2 ? "Uploading..." : "Upload Image 2"}
                          <Upload className="ml-2 h-4 w-4" />
                        </Button>
                        <input
                          ref={imageInputRef2}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, 'imageUrl2');
                            }
                          }}
                          className="hidden"
                        />
                        {giftForm.imageUrl2 && (
                          <div className="relative">
                            <img 
                              src={giftForm.imageUrl2} 
                              alt="Preview 2" 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setGiftForm(prev => ({ ...prev, imageUrl2: "" }))}
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image 3 */}
                    <div className="space-y-2">
                      <Label>Image 3 (Optional)</Label>
                      <div className="flex flex-col space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef3.current?.click()}
                          disabled={isImageUploading3}
                          className="w-full"
                        >
                          {isImageUploading3 ? "Uploading..." : "Upload Image 3"}
                          <Upload className="ml-2 h-4 w-4" />
                        </Button>
                        <input
                          ref={imageInputRef3}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, 'imageUrl3');
                            }
                          }}
                          className="hidden"
                        />
                        {giftForm.imageUrl3 && (
                          <div className="relative">
                            <img 
                              src={giftForm.imageUrl3} 
                              alt="Preview 3" 
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setGiftForm(prev => ({ ...prev, imageUrl3: "" }))}
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={giftForm.price}
                        onChange={(e) => setGiftForm({ ...giftForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="isbn">ISBN (for books)</Label>
                      <Input
                        id="isbn"
                        value={giftForm.isbn}
                        onChange={(e) => setGiftForm({ ...giftForm, isbn: e.target.value })}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={giftForm.sortOrder}
                        onChange={(e) => setGiftForm({ ...giftForm, sortOrder: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="isActive"
                        checked={giftForm.isActive}
                        onCheckedChange={(checked) => setGiftForm({ ...giftForm, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsGiftDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={giftMutation.isPending}>
                      {giftMutation.isPending ? 'Saving...' : (editingGift ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Loading gift items...
                      </TableCell>
                    </TableRow>
                  ) : giftItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No gift items found. Add your first gift item!
                      </TableCell>
                    </TableRow>
                  ) : (
                    giftItems.map((gift) => (
                      <TableRow key={gift.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            {gift.sortOrder}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            {gift.name}
                            {gift.price && (
                              <div className="text-sm text-green-600 font-medium">
                                ${parseFloat(gift.price).toFixed(2)}
                              </div>
                            )}
                            {gift.isbn && (
                              <div className="text-xs text-gray-500">
                                ISBN: {gift.isbn}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={gift.type === 'novel' ? 'default' : 'secondary'}>
                              {gift.type}
                            </Badge>
                            <div className="flex gap-1 flex-wrap">
                              {gift.imageUrl && (
                                <img 
                                  src={gift.imageUrl} 
                                  alt={`${gift.name} - Image 1`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                              )}
                              {gift.imageUrl2 && (
                                <img 
                                  src={gift.imageUrl2} 
                                  alt={`${gift.name} - Image 2`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                              )}
                              {gift.imageUrl3 && (
                                <img 
                                  src={gift.imageUrl3} 
                                  alt={`${gift.name} - Image 3`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={gift.isActive ? 'default' : 'secondary'}>
                            {gift.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(gift.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditGift(gift)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteGiftMutation.mutate(gift.id)}
                              disabled={deleteGiftMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Homepage Content ({homepageContent.length})</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage content displayed on the homepage
              </p>
            </div>
            <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetContentForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content Section
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingContent ? 'Edit Content Section' : 'Add New Content Section'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleContentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={contentForm.section}
                        onValueChange={(value) => setContentForm({ ...contentForm, section: value })}
                        defaultValue="gift_offer"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gift_offer">Gift Offer</SelectItem>
                          <SelectItem value="hero">Hero Section</SelectItem>
                          <SelectItem value="about">About Section</SelectItem>
                          <SelectItem value="featured">Featured Section</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="contentActive"
                        checked={contentForm.isActive}
                        onCheckedChange={(checked) => setContentForm({ ...contentForm, isActive: checked })}
                      />
                      <Label htmlFor="contentActive">Active</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={contentForm.title}
                      onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                      placeholder="Section title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={contentForm.subtitle}
                      onChange={(e) => setContentForm({ ...contentForm, subtitle: e.target.value })}
                      placeholder="Section subtitle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={contentForm.content}
                      onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                      placeholder="Main content text"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="settings">Settings (JSON)</Label>
                    <Textarea
                      id="settings"
                      value={contentForm.settings}
                      onChange={(e) => setContentForm({ ...contentForm, settings: e.target.value })}
                      placeholder='{"color": "blue", "showIcon": true}'
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsContentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={contentMutation.isPending}>
                      {contentMutation.isPending ? 'Saving...' : (editingContent ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading content...
                      </TableCell>
                    </TableRow>
                  ) : homepageContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No content sections found. Add your first content section!
                      </TableCell>
                    </TableRow>
                  ) : (
                    homepageContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">
                            {content.section.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{content.title || 'No title'}</TableCell>
                        <TableCell>
                          <Badge variant={content.isActive ? 'default' : 'secondary'}>
                            {content.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(content.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditContent(content)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteContentMutation.mutate(content.id)}
                              disabled={deleteContentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}