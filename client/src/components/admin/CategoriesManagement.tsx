import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category } from "@/types";

interface CategoryForm {
    name: string;
    slug: string;
    description: string;
}

const initialCategoryForm: CategoryForm = {
    name: "",
    slug: "",
    description: "",
};

export default function CategoriesManagement() {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    const updateCategoryMutation = useMutation({
        mutationFn: async (data: Category & CategoryForm) => {
            await apiRequest("POST", "/api/updateCategory", data);
        },
        onSuccess: () => {
            toast({
                title: "Category updated",
                description: "The category has been updated successfully.",
            });
            setEditDialogOpen(false);
            setCategoryToEdit(null);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update category",
                variant: "destructive",
            });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("POST", "/api/deleteCategory", { id });
        },
        onSuccess: () => {
            toast({
                title: "Category deleted",
                description: "The category has been deleted successfully.",
            });
            setDeleteLoadingId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete category",
                variant: "destructive",
            });
            setDeleteLoadingId(null);
        },
    });

    const handleEditClick = (category: Category) => {
        setCategoryToEdit(category);
        setEditDialogOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryToEdit) return;
        updateCategoryMutation.mutate({
            ...categoryToEdit,
            name: categoryToEdit.name,
            slug: categoryToEdit.slug,
            description: categoryToEdit.description,
        });
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            setDeleteLoadingId(id);
            deleteCategoryMutation.mutate(id);
        }
    };
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);

    const { data: categories = [], isFetching } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const createCategoryMutation = useMutation({
        mutationFn: async (data: CategoryForm) => {
            await apiRequest("POST", "/api/createCategory", data);
        },
        onSuccess: () => {
            toast({
                title: "Category created",
                description: "The category has been created successfully.",
            });
            setIsCategoryDialogOpen(false);
            setCategoryForm(initialCategoryForm);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            console.log("error", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create category",
                variant: "destructive",
            });
        },
    });

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = categoryForm.slug || categoryForm.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        createCategoryMutation.mutate({
            ...categoryForm,
            slug,
        });
    };

    const resetCategoryForm = () => {
        setCategoryForm(initialCategoryForm);
    };

    const handleNameChange = (name: string) => {
        setCategoryForm(prev => ({
            ...prev,
            name,
            slug: prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                : prev.slug
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Book Categories
                    </span>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetCategoryForm} className="bg-primary-aqua hover:bg-secondary-aqua">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Categorys</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCategorySubmit} className="space-y-4 px-1 sm:px-0 w-full">
                                <div>
                                    <Label htmlFor="categoryName">Category Name *</Label>
                                    <Input
                                        id="categoryName"
                                        value={categoryForm.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        required
                                        placeholder="e.g., Science Fiction"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="categorySlug">URL Slug *</Label>
                                    <Input
                                        id="categorySlug"
                                        value={categoryForm.slug}
                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                                        required
                                        placeholder="e.g., science-fiction"
                                    />
                                    <p className="text-xs text-secondary-black mt-1">
                                        Used in URLs. Auto-generated from name if left empty.
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="categoryDescription">Description</Label>
                                    <Textarea
                                        id="categoryDescription"
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        placeholder="Optional description for the category"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCategoryDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createCategoryMutation.isPending || isFetching}
                                        className="bg-primary-aqua hover:bg-secondary-aqua"
                                    >
                                        Create Category
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {categories.length > 0 ? (
                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h3 className="font-semibold text-base-black">{category.name}</h3>
                                    <p className="text-sm text-secondary-black">Slug: {category.slug}</p>
                                    {category.description && (
                                        <p className="text-sm text-tertiary-black mt-1">{category.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:text-white hover:bg-blue-500 rounded-full "
                                        onClick={() => handleEditClick(category)}
                                        disabled={isFetching}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-abe-red hover:text-white hover:bg-red-500 rounded-full "
                                        onClick={() => handleDeleteClick(category.id)}
                                        disabled={deleteLoadingId === category.id || isFetching}
                                    >
                                        {deleteLoadingId === category.id ? (
                                            <span className="animate-spin mr-2 w-4 h-4 border-2 border-t-transparent border-abe-red rounded-full inline-block"></span>
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-base-black mb-2">No categories yet</h3>
                        <p className="text-secondary-black mb-4">
                            Create your first book category to organize your inventory.
                        </p>
                        <Button
                            onClick={() => setIsCategoryDialogOpen(true)}
                            className="bg-primary-aqua hover:bg-secondary-aqua"
                            disabled={isFetching}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Category
                        </Button>
                    </div>
                )}
            </CardContent>
            {/* Edit Category Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    {categoryToEdit && (
                        <form onSubmit={handleEditSubmit} className="space-y-4 px-1 sm:px-0 w-full">
                            <div>
                                <Label htmlFor="editCategoryName">Category Name *</Label>
                                <Input
                                    id="editCategoryName"
                                    value={categoryToEdit.name}
                                    onChange={e => setCategoryToEdit(prev => prev ? { ...prev, name: e.target.value } : prev)}
                                    required
                                    placeholder="e.g., Science Fiction"
                                />
                            </div>
                            <div>
                                <Label htmlFor="editCategorySlug">URL Slug *</Label>
                                <Input
                                    id="editCategorySlug"
                                    value={categoryToEdit.slug}
                                    onChange={e => setCategoryToEdit(prev => prev ? { ...prev, slug: e.target.value } : prev)}
                                    required
                                    placeholder="e.g., science-fiction"
                                />
                            </div>
                            <div>
                                <Label htmlFor="editCategoryDescription">Description</Label>
                                <Textarea
                                    id="editCategoryDescription"
                                    value={categoryToEdit.description || ""}
                                    onChange={e => setCategoryToEdit(prev => prev ? { ...prev, description: e.target.value } : prev)}
                                    rows={3}
                                    placeholder="Optional description for the category"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateCategoryMutation.isPending} className="bg-primary-aqua hover:bg-secondary-aqua">
                                    Update Category
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
