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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Package, Gift, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GiftCategory } from "@/shared/schema";

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift Categories Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage gift categories like Classic Novel, Mystery Novel, Premium Notebook, etc.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Categories ({categories.length})</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize your gift items into categories
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Gift Category' : 'Add New Gift Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Classic Novel, Mystery Novel"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "novel" | "notebook" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="novel">Novel</option>
                    <option value="notebook">Notebook</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Image Upload Sections */}
              <div>
                <Label>Category Images</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {/* Image 1 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image 1</Label>
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image 1
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {(imagePreview || uploadedImage) && (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview 1" 
                            className="w-full h-32 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={clearImage}
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
                    <Label className="text-sm font-medium">Image 2 (Optional)</Label>
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef2.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image 2
                      </Button>
                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload2}
                        className="hidden"
                      />
                      {(imagePreview2 || uploadedImage2) && (
                        <div className="relative">
                          <img 
                            src={imagePreview2} 
                            alt="Preview 2" 
                            className="w-full h-32 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={clearImage2}
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
                    <Label className="text-sm font-medium">Image 3 (Optional)</Label>
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef3.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image 3
                      </Button>
                      <input
                        ref={fileInputRef3}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload3}
                        className="hidden"
                      />
                      {(imagePreview3 || uploadedImage3) && (
                        <div className="relative">
                          <img 
                            src={imagePreview3} 
                            alt="Preview 3" 
                            className="w-full h-32 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={clearImage3}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={categoryMutation.isPending}
                  className="flex-1"
                >
                  {categoryMutation.isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Package className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No gift categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by creating your first gift category
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gift Categories List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {category.imageUrl && (
                          <img 
                            src={category.imageUrl} 
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.type === 'novel' ? 'default' : 'secondary'}>
                        {category.type === 'novel' ? '📖 Novel' : '📝 Notebook'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      ${Number(category.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}