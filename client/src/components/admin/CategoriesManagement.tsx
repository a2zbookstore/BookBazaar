import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag, Hash, AlignLeft, ArrowUpDown, Loader2, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category } from "@/types";

interface CategoryForm {
    name: string;
    slug: string;
    description: string;
    sort_order?: number | "";
}

const initialCategoryForm: CategoryForm = {
    name: "",
    slug: "",
    description: "",
    sort_order: "",
};

/* ── reusable labelled input wrapper ── */
function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                {icon} {label}
            </Label>
            {children}
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

export default function CategoriesManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

    const { data: categories = [], isFetching } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const createCategoryMutation = useMutation({
        mutationFn: async (data: CategoryForm) => {
            await apiRequest("POST", "/api/createCategory", data);
        },
        onSuccess: () => {
            toast({ title: "Category created", description: "The category has been created successfully." });
            setIsCategoryDialogOpen(false);
            setCategoryForm(initialCategoryForm);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create category", variant: "destructive" });
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: async (data: Category & CategoryForm) => {
            await apiRequest("POST", "/api/updateCategory", data);
        },
        onSuccess: () => {
            toast({ title: "Category updated", description: "The category has been updated successfully." });
            setEditDialogOpen(false);
            setCategoryToEdit(null);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update category", variant: "destructive" });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", "/api/deleteCategory", { id });
        },
        onSuccess: () => {
            toast({ title: "Category deleted", description: "The category has been deleted successfully." });
            setDeleteLoadingId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete category", variant: "destructive" });
            setDeleteLoadingId(null);
        },
    });

    const handleNameChange = (name: string) => {
        setCategoryForm(prev => ({
            ...prev,
            name,
            slug: prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                : prev.slug,
        }));
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        createCategoryMutation.mutate({ ...categoryForm, slug, sort_order: categoryForm.sort_order === "" ? undefined : Number(categoryForm.sort_order) });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryToEdit) return;
        updateCategoryMutation.mutate({
            ...categoryToEdit,
            description: categoryToEdit.description ?? "",
            sort_order: typeof categoryToEdit.sort_order === 'number' ? categoryToEdit.sort_order : undefined,
        });
    };

    const handleEditClick = (category: Category) => {
        setCategoryToEdit({ ...category });
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            setDeleteLoadingId(id);
            deleteCategoryMutation.mutate(id);
        }
    };

    /* ── shared dialog form fields ── */
    const CategoryFormFields = ({
        values, onChange,
    }: {
        values: CategoryForm;
        onChange: (field: keyof CategoryForm, value: string) => void;
    }) => (
        <div className="space-y-4">
            <Field label="Category Name" icon={<Tag className="h-3.5 w-3.5" />}>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 h-10"
                        value={values.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        required
                        placeholder="e.g., Science Fiction"
                    />
                </div>
            </Field>
            <Field label="URL Slug" icon={<Hash className="h-3.5 w-3.5" />} hint="Auto-generated from name. Used in URLs.">
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 h-10 font-mono text-sm"
                        value={values.slug}
                        onChange={(e) => onChange("slug", e.target.value)}
                        required
                        placeholder="science-fiction"
                    />
                </div>
            </Field>
            <Field label="Description" icon={<AlignLeft className="h-3.5 w-3.5" />}>
                <Textarea
                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 resize-none"
                    value={values.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    rows={3}
                    placeholder="Optional description for this category"
                />
            </Field>
            <Field label="Sort Order" icon={<ArrowUpDown className="h-3.5 w-3.5" />} hint="Lower number = displayed first.">
                <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        type="number"
                        min={0}
                        className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 h-10"
                        value={values.sort_order ?? ""}
                        onChange={(e) => onChange("sort_order", e.target.value)}
                        placeholder="e.g., 1"
                    />
                </div>
            </Field>
        </div>
    );

    return (
        <>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow">
                            <Tag className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Book Categories</p>
                            <p className="text-xs text-gray-500">{categories.length} categor{categories.length !== 1 ? "ies" : "y"} configured</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setCategoryForm(initialCategoryForm); setIsCategoryDialogOpen(true); }}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all gap-2 h-9 px-4 text-sm"
                        disabled={isFetching}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Category</span>
                    </Button>
                </div>

                <CardContent className="p-0">
                    {isFetching && categories.length === 0 ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-sm">Loading categories…</span>
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {categories.map((category, idx) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-50/30 transition-colors group"
                                >
                                    {/* Order badge */}
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                                        {category.sort_order ?? idx + 1}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{category.name}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">/{category.slug}</p>
                                        {category.description && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{category.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(category)}
                                            disabled={isFetching}
                                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(category.id)}
                                            disabled={deleteLoadingId === category.id || isFetching}
                                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                                        >
                                            {deleteLoadingId === category.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <FolderOpen className="h-12 w-12 opacity-30" />
                            <p className="font-medium text-sm">No categories yet</p>
                            <p className="text-xs text-center max-w-xs">Create your first category to organise your book inventory.</p>
                            <Button
                                onClick={() => { setCategoryForm(initialCategoryForm); setIsCategoryDialogOpen(true); }}
                                className="mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add First Category
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Create Dialog ── */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl overflow-hidden border-0 shadow-2xl">
                    {/* header */}
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 px-6 pt-6 pb-5 text-white">
                        <div className="flex items-center justify-between">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-white">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                                        <Plus className="h-5 w-5 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">New Category</p>
                                        <p className="text-xs text-slate-400 font-normal">Add a new book category</p>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                        </div>
                    </div>
                    {/* body */}
                    <form onSubmit={handleCategorySubmit} className="px-6 py-5 space-y-4 bg-white">
                        <CategoryFormFields
                            values={categoryForm}
                            onChange={(field, value) => {
                                if (field === "name") handleNameChange(value);
                                else setCategoryForm(prev => ({ ...prev, [field]: value }));
                            }}
                        />
                        <div className="flex gap-3 pt-1">
                            <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="flex-none rounded-xl border-slate-200 text-slate-600 h-10 px-4">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createCategoryMutation.isPending || isFetching}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl h-10 shadow-md"
                            >
                                {createCategoryMutation.isPending
                                    ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span>
                                    : <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Create Category</span>}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl overflow-hidden border-0 shadow-2xl">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 px-6 pt-6 pb-5 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-white">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                                    <Edit className="h-5 w-5 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="font-bold text-base">Edit Category</p>
                                    <p className="text-xs text-slate-400 font-normal truncate max-w-[200px]">{categoryToEdit?.name}</p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    {categoryToEdit && (
                        <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4 bg-white">
                            <CategoryFormFields
                                values={{ ...categoryToEdit, description: categoryToEdit.description ?? "" }}
                                onChange={(field, value) =>
                                    setCategoryToEdit(prev => prev ? { ...prev, [field]: value } : prev)
                                }
                            />
                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-none rounded-xl border-slate-200 text-slate-600 h-10 px-4">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateCategoryMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl h-10 shadow-md"
                                >
                                    {updateCategoryMutation.isPending
                                        ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>
                                        : <span className="flex items-center gap-2"><Edit className="h-4 w-4" /> Save Changes</span>}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
