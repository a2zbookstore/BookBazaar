import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag, Hash, AlignLeft, ArrowUpDown, Loader2, FolderOpen, X, ChevronDown, ChevronRight, Layers, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category, SubCategory } from "@/types";

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

interface SubCategoryForm {
    name: string;
    slug: string;
    description: string;
    categoryId: number | "";
    sort_order?: number | "";
}

const initialSubCategoryForm: SubCategoryForm = {
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    sort_order: "",
};

/* ── batch row for multi-add dialog ── */
interface SubCategoryBatchRow {
    id: string;
    name: string;
    slug: string;
    sort_order: string;
    status: "idle" | "saving" | "done" | "error";
    error?: string;
}
const newBatchRow = (): SubCategoryBatchRow => ({
    id: Math.random().toString(36).slice(2),
    name: "",
    slug: "",
    sort_order: "",
    status: "idle",
});

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

/* ── subcategory form fields ── */
const SubCategoryFormFields = ({
    values, onChange, categories,
}: {
    values: SubCategoryForm;
    onChange: (field: keyof SubCategoryForm, value: string) => void;
    categories: Category[];
}) => (
    <div className="space-y-4">
        <Field label="Parent Category" icon={<Tag className="h-3.5 w-3.5" />}>
            <Select
                value={values.categoryId ? String(values.categoryId) : ""}
                onValueChange={(v) => onChange("categoryId", v)}
                required
            >
                <SelectTrigger className="rounded-xl border-slate-200 h-10">
                    <SelectValue placeholder="Select a category…" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
        <Field label="Subcategory Name" icon={<Layers className="h-3.5 w-3.5" />}>
            <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                    className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 h-10"
                    value={values.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    required
                    placeholder="e.g., Space Opera"
                />
            </div>
        </Field>
        <Field label="URL Slug" icon={<Hash className="h-3.5 w-3.5" />} hint="Auto-generated from name. You can override it.">
            <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                    className="pl-9 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 h-10 font-mono text-sm"
                    value={values.slug}
                    onChange={(e) => onChange("slug", e.target.value)}
                    placeholder="auto-generated"
                />
            </div>
        </Field>
        <Field label="Description" icon={<AlignLeft className="h-3.5 w-3.5" />}>
            <Textarea
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-200 resize-none"
                value={values.description}
                onChange={(e) => onChange("description", e.target.value)}
                rows={2}
                placeholder="Optional description"
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

export default function CategoriesManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

    // Subcategory state
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
    const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
    const [subCategoryForm, setSubCategoryForm] = useState<SubCategoryForm>(initialSubCategoryForm);
    // Multi-add batch state
    const [batchCategoryId, setBatchCategoryId] = useState<number | "">("");
    const [batchRows, setBatchRows] = useState<SubCategoryBatchRow[]>([newBatchRow()]);
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const lastRowRef = useRef<HTMLInputElement>(null);
    const [editSubCategoryDialogOpen, setEditSubCategoryDialogOpen] = useState(false);
    const [subCategoryToEdit, setSubCategoryToEdit] = useState<SubCategory | null>(null);
    const [deleteSubLoadingId, setDeleteSubLoadingId] = useState<number | null>(null);

    const { data: categories = [], isFetching } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const { data: allSubCategories = [] } = useQuery<SubCategory[]>({
        queryKey: ["/api/subcategories"],
    });

    // Auto-expand all categories when they first load
    useEffect(() => {
        if (categories.length > 0) {
            setExpandedCategoryIds(new Set(categories.map(c => c.id)));
        }
    }, [categories.length]);

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

    const toggleHomepageMutation = useMutation({
        mutationFn: async ({ id, showOnHomepage }: { id: number; showOnHomepage: boolean }) => {
            await apiRequest("POST", "/api/toggleCategoryHomepage", { id, showOnHomepage });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update category", variant: "destructive" });
        },
    });

    // ── Subcategory mutations ──
    const createSubCategoryMutation = useMutation({
        mutationFn: async (data: SubCategoryForm) => {
            await apiRequest("POST", "/api/createSubCategory", {
                ...data,
                categoryId: Number(data.categoryId),
                sort_order: (data.sort_order == null || String(data.sort_order) === "") ? undefined : Number(data.sort_order),
            });
        },
        onSuccess: () => {
            toast({ title: "Subcategory created", description: "The subcategory has been created successfully." });
            setIsSubCategoryDialogOpen(false);
            setSubCategoryForm(initialSubCategoryForm);
            queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create subcategory", variant: "destructive" });
        },
    });

    const updateSubCategoryMutation = useMutation({
        mutationFn: async (data: SubCategory & SubCategoryForm) => {
            await apiRequest("POST", "/api/updateSubCategory", {
                ...data,
                categoryId: Number(data.categoryId),
                sort_order: (data.sort_order == null || String(data.sort_order) === "") ? undefined : Number(data.sort_order),
            });
        },
        onSuccess: () => {
            toast({ title: "Subcategory updated", description: "The subcategory has been updated successfully." });
            setEditSubCategoryDialogOpen(false);
            setSubCategoryToEdit(null);
            queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update subcategory", variant: "destructive" });
        },
    });

    const deleteSubCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", "/api/deleteSubCategory", { id });
        },
        onSuccess: () => {
            toast({ title: "Subcategory deleted", description: "The subcategory has been deleted successfully." });
            setDeleteSubLoadingId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete subcategory", variant: "destructive" });
            setDeleteSubLoadingId(null);
        },
    });

    const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Subcategory handlers
    const toggleCategoryExpand = (id: number) => {
        setExpandedCategoryIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleAddSubCategory = (categoryId: number) => {
        setBatchCategoryId(categoryId);
        setBatchRows([newBatchRow()]);
        setBatchSubmitting(false);
        setIsSubCategoryDialogOpen(true);
    };

    const updateBatchRow = (id: string, patch: Partial<SubCategoryBatchRow>) => {
        setBatchRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    };

    const handleBatchRowNameChange = (id: string, name: string) => {
        setBatchRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const autoSlug = r.slug === toSlug(r.name) || r.slug === "";
            return { ...r, name, slug: autoSlug ? toSlug(name) : r.slug };
        }));
    };

    const addBatchRow = () => {
        setBatchRows(prev => [...prev, newBatchRow()]);
        setTimeout(() => lastRowRef.current?.focus(), 50);
    };

    const removeBatchRow = (id: string) => {
        setBatchRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
    };

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const filled = batchRows.filter(r => r.name.trim() !== "");
        if (filled.length === 0) return;

        // Check for duplicates within the batch
        const batchNames = filled.map(r => r.name.trim().toLowerCase());
        const hasBatchDupe = batchNames.some((n, i) => batchNames.indexOf(n) !== i);
        if (hasBatchDupe) {
            toast({ title: "Duplicate names", description: "Each subcategory in the list must have a unique name.", variant: "destructive" });
            return;
        }
        // Check against existing
        const existing = allSubCategories.map(s => s.name.trim().toLowerCase());
        const dupeWithExisting = filled.find(r => existing.includes(r.name.trim().toLowerCase()));
        if (dupeWithExisting) {
            toast({ title: "Duplicate name", description: `"${dupeWithExisting.name.trim()}" already exists.`, variant: "destructive" });
            return;
        }

        setBatchSubmitting(true);
        let successCount = 0;
        const updatedRows = [...batchRows];

        for (const row of filled) {
            const idx = updatedRows.findIndex(r => r.id === row.id);
            updatedRows[idx] = { ...updatedRows[idx], status: "saving" };
            setBatchRows([...updatedRows]);
            try {
                await apiRequest("POST", "/api/createSubCategory", {
                    name: row.name.trim(),
                    slug: row.slug || toSlug(row.name),
                    description: "",
                    categoryId: Number(batchCategoryId),
                    sort_order: row.sort_order === "" ? undefined : Number(row.sort_order),
                });
                updatedRows[idx] = { ...updatedRows[idx], status: "done" };
                successCount++;
            } catch (err) {
                updatedRows[idx] = { ...updatedRows[idx], status: "error", error: err instanceof Error ? err.message : "Failed" };
            }
            setBatchRows([...updatedRows]);
        }

        queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
        setBatchSubmitting(false);

        if (successCount === filled.length) {
            toast({ title: `${successCount} subcategor${successCount === 1 ? "y" : "ies"} created`, description: "All subcategories were added successfully." });
            setIsSubCategoryDialogOpen(false);
        } else {
            toast({ title: `${successCount} of ${filled.length} created`, description: "Some subcategories failed — check the list.", variant: "destructive" });
        }
    };

    // kept for legacy use (not called anymore for create, only referenced)
    const handleSubCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleEditSubCategory = (sub: SubCategory) => {
        setSubCategoryToEdit({ ...sub });
        setEditSubCategoryDialogOpen(true);
    };

    const handleEditSubCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subCategoryToEdit) return;
        const trimmedName = subCategoryToEdit.name.trim().toLowerCase();
        const isDuplicate = allSubCategories.some(
            s => s.name.trim().toLowerCase() === trimmedName && s.id !== subCategoryToEdit.id
        );
        if (isDuplicate) {
            toast({ title: "Duplicate name", description: `A subcategory named "${subCategoryToEdit.name.trim()}" already exists. Please use a unique name.`, variant: "destructive" });
            return;
        }
        const slug = subCategoryToEdit.slug || toSlug(subCategoryToEdit.name);
        updateSubCategoryMutation.mutate({ ...subCategoryToEdit, slug } as any);
    };

    const handleDeleteSubCategory = (id: number) => {
        if (window.confirm("Are you sure you want to delete this subcategory?")) {
            setDeleteSubLoadingId(id);
            deleteSubCategoryMutation.mutate(id);
        }
    };

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
                            {categories.map((category, idx) => {
                                const catSubs = allSubCategories.filter(s => s.categoryId === category.id);
                                const isExpanded = expandedCategoryIds.has(category.id);
                                return (
                                <div key={category.id} className="border-b border-gray-50 last:border-0">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                                        onClick={() => toggleCategoryExpand(category.id)}
                                    >
                                        {/* Expand icon */}
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </div>

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

                                        {/* Subcategory count badge */}
                                        {catSubs.length > 0 && (
                                            <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium shrink-0">
                                                {catSubs.length} sub
                                            </span>
                                        )}

                                        {/* Actions */}
                                        <div
                                            className="flex items-center gap-1.5 shrink-0"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleHomepageMutation.mutate({ id: category.id, showOnHomepage: !(category.showOnHomepage ?? true) })}
                                                disabled={toggleHomepageMutation.isPending}
                                                title={category.showOnHomepage === false ? "Hidden from homepage — click to show" : "Visible on homepage — click to hide"}
                                                className={`h-7 px-2 text-xs rounded-lg gap-1 ${category.showOnHomepage === false ? "border-gray-200 text-gray-400 hover:bg-gray-50 hover:border-gray-400" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"}`}
                                            >
                                                {toggleHomepageMutation.isPending
                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                    : category.showOnHomepage === false
                                                        ? <><EyeOff className="h-3 w-3" /><span className="hidden sm:inline">Homepage</span></>
                                                        : <><Eye className="h-3 w-3" /><span className="hidden sm:inline">Homepage</span></>
                                                }
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddSubCategory(category.id)}
                                                className="h-7 px-2 text-xs rounded-lg border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400 gap-1"
                                            >
                                                <Plus className="h-3 w-3" /> Sub
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditClick(category)}
                                                disabled={isFetching}
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors opacity-60 group-hover:opacity-100"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(category.id)}
                                                disabled={deleteLoadingId === category.id || isFetching}
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors opacity-60 group-hover:opacity-100"
                                            >
                                                {deleteLoadingId === category.id
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subcategory panel */}
                                    {isExpanded && (
                                        <div className="bg-slate-50/60 border-t border-gray-100 px-5 pb-4 pt-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                                    <Layers className="h-3 w-3" /> Subcategories
                                                </p>
                                                {/* <Button
                                                    size="sm"
                                                    onClick={() => handleAddSubCategory(category.id)}
                                                    className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg gap-1"
                                                >
                                                    <Plus className="h-3 w-3" /> Add Subcategory
                                                </Button> */}
                                            </div>
                                            {catSubs.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic py-2">No subcategories yet. Click "Add Subcategory" to create one.</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {catSubs.map(sub => (
                                                        <div key={sub.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100 group/sub hover:border-violet-200 transition-colors">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700 text-xs font-bold">
                                                                {sub.sort_order ?? "–"}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">{sub.name}</p>
                                                                <p className="text-xs text-gray-400 font-mono truncate">/{sub.slug}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-50 group-hover/sub:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditSubCategory(sub)}
                                                                    className="h-6 w-6 p-0 rounded-md hover:bg-blue-100 hover:text-blue-700"
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteSubCategory(sub.id)}
                                                                    disabled={deleteSubLoadingId === sub.id}
                                                                    className="h-6 w-6 p-0 rounded-md hover:bg-red-100 hover:text-red-700"
                                                                >
                                                                    {deleteSubLoadingId === sub.id
                                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                        : <Trash2 className="h-3 w-3" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
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
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden">
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
                            <DialogClose className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
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
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 px-6 pt-6 pb-5 text-white">
                        <div className="flex items-center justify-between">
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
                            <DialogClose className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
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

            {/* ── Create Subcategory Dialog (multi-add) ── */}
            <Dialog open={isSubCategoryDialogOpen} onOpenChange={(open) => { if (!batchSubmitting) setIsSubCategoryDialogOpen(open); }}>
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-lg rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden">
                    {/* header */}
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950 px-6 pt-6 pb-5 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-white">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                                        <Layers className="h-5 w-5 text-violet-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">Add Subcategories</p>
                                        <p className="text-xs text-slate-400 font-normal">Add one or more at once</p>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                            <DialogClose disabled={batchSubmitting} className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </div>

                    <form onSubmit={handleBatchSubmit} className="bg-white flex flex-col">
                        {/* category selector */}
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                                <Tag className="h-3.5 w-3.5" /> Parent Category
                            </Label>
                            <Select
                                value={batchCategoryId ? String(batchCategoryId) : ""}
                                onValueChange={(v) => setBatchCategoryId(Number(v))}
                                required
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                    <SelectValue placeholder="Select a category…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* rows */}
                        <div className="px-6 py-4 space-y-2.5 overflow-y-auto max-h-[42vh]">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subcategory Names</p>
                            {batchRows.map((row, idx) => (
                                <div key={row.id} className="flex items-center gap-2">
                                    {/* status icon */}
                                    <div className="w-5 shrink-0 flex items-center justify-center">
                                        {row.status === "saving" && <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />}
                                        {row.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                        {row.status === "error" && <X className="h-3.5 w-3.5 text-red-500" />}
                                    </div>
                                    {/* name input */}
                                    <div className="flex-1 relative">
                                        <input
                                            ref={idx === batchRows.length - 1 ? lastRowRef : undefined}
                                            type="text"
                                            className={`w-full h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                                                row.status === "done" ? "border-emerald-300 bg-emerald-50 text-emerald-700" :
                                                row.status === "error" ? "border-red-300 bg-red-50" :
                                                "border-slate-200 bg-white"
                                            }`}
                                            placeholder={`Subcategory ${idx + 1}`}
                                            value={row.name}
                                            onChange={e => handleBatchRowNameChange(row.id, e.target.value)}
                                            disabled={row.status === "done" || row.status === "saving" || batchSubmitting}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") { e.preventDefault(); addBatchRow(); }
                                            }}
                                        />
                                        {row.slug && row.status === "idle" && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">{row.slug}</span>
                                        )}
                                        {row.status === "error" && (
                                            <span className="absolute -bottom-4 left-0 text-[10px] text-red-500">{row.error}</span>
                                        )}
                                    </div>
                                    {/* sort order */}
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-14 h-9 rounded-xl border border-slate-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                                        placeholder="#"
                                        title="Sort order"
                                        value={row.sort_order}
                                        onChange={e => updateBatchRow(row.id, { sort_order: e.target.value })}
                                        disabled={row.status === "done" || row.status === "saving" || batchSubmitting}
                                    />
                                    {/* remove */}
                                    <button
                                        type="button"
                                        onClick={() => removeBatchRow(row.id)}
                                        disabled={batchRows.length === 1 || row.status === "saving" || batchSubmitting}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            {/* add row */}
                            <button
                                type="button"
                                onClick={addBatchRow}
                                disabled={batchSubmitting}
                                className="mt-1 flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors disabled:opacity-40"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add another
                            </button>
                        </div>

                        {/* footer */}
                        <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsSubCategoryDialogOpen(false)}
                                disabled={batchSubmitting}
                                className="flex-none rounded-xl border-slate-200 text-slate-600 h-10 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={batchSubmitting || !batchCategoryId || batchRows.every(r => r.name.trim() === "")}
                                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl h-10 shadow-md"
                            >
                                {batchSubmitting
                                    ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span>
                                    : (() => {
                                        const count = batchRows.filter(r => r.name.trim() !== "").length;
                                        return <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Create {count > 1 ? `${count} Subcategories` : "Subcategory"}</span>;
                                    })()
                                }
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Edit Subcategory Dialog ── */}
            <Dialog open={editSubCategoryDialogOpen} onOpenChange={setEditSubCategoryDialogOpen}>
                <DialogContent className="p-0 gap-0 max-w-[92vw] sm:max-w-md rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950 px-6 pt-6 pb-5 text-white">
                        <div className="flex items-center justify-between">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-white">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                                        <Edit className="h-5 w-5 text-violet-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">Edit Subcategory</p>
                                        <p className="text-xs text-slate-400 font-normal truncate max-w-[200px]">{subCategoryToEdit?.name}</p>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                            <DialogClose className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </div>
                    {subCategoryToEdit && (
                        <form onSubmit={handleEditSubCategorySubmit} className="px-6 py-5 space-y-4 bg-white">
                            <SubCategoryFormFields
                                values={{
                                    name: subCategoryToEdit.name,
                                    slug: subCategoryToEdit.slug,
                                    description: subCategoryToEdit.description ?? "",
                                    categoryId: subCategoryToEdit.categoryId,
                                    sort_order: subCategoryToEdit.sort_order ?? "",
                                }}
                                categories={categories}
                                onChange={(field, value) =>
                                    setSubCategoryToEdit(prev => prev ? { ...prev, [field]: field === "categoryId" || field === "sort_order" ? (value === "" ? (field === "categoryId" ? prev.categoryId : undefined) : Number(value)) : value } as SubCategory : prev)
                                }
                            />
                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" onClick={() => setEditSubCategoryDialogOpen(false)} className="flex-none rounded-xl border-slate-200 text-slate-600 h-10 px-4">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateSubCategoryMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl h-10 shadow-md"
                                >
                                    {updateSubCategoryMutation.isPending
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
