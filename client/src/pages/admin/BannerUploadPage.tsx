
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BannerUploadPage() {
    const { toast } = useToast();
    const [pageName, setPageName] = useState("");

    const [bannerImages, setBannerImages] = useState(["", "", "", "", ""]);
    const [bannerLinks, setBannerLinks] = useState(["", "", "", "", ""]);
    const [isUploading, setIsUploading] = useState([false, false, false, false, false]);
    const [isSaving, setIsSaving] = useState(false);
    const imageInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid File",
                description: "Please select an image file (PNG, JPG, etc.)",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Image must be less than 5MB.",
                variant: "destructive",
            });
            return;
        }
        setIsUploading(prev => prev.map((v, i) => i === idx ? true : v));
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch("/api/banners/upload", {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setBannerImages(prev => prev.map((img, i) => i === idx ? data.imageUrl : img));
            // Store image info in DB

        } catch {
            toast({
                title: "Upload Failed",
                description: "There was an error uploading the image. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(prev => prev.map((v, i) => i === idx ? false : v));
        }
    };

    const handleSaveBanners = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const filledImages = bannerImages.filter(Boolean);
        if (filledImages.length === 0) {
            toast({
                title: "No Images",
                description: "Please upload or paste at least one banner image before saving.",
                variant: "destructive",
            });
            return;
        }
        if (!pageName.trim()) {
            toast({
                title: "Page Name Required",
                description: "Please select or enter a page name.",
                variant: "destructive",
            });
            return;
        }
        setIsSaving(true);
        try {
            const saveRes = await fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_urls: filledImages,
                    link_urls: bannerLinks.slice(0, filledImages.length),
                    page_type: pageName.trim(),
                    is_active: true
                }),
                credentials: "include"
            });
            if (!saveRes.ok) {
                const err = await saveRes.json().catch(() => ({}));
                throw new Error(err.message || "Save failed");
            }
            toast({
                title: "Banners Saved",
                description: `${filledImages.length} banner(s) saved for "${pageName.trim()}".`,
            });
        } catch (err: any) {
            toast({
                title: "Save Failed",
                description: err.message || "There was an error saving the banners.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!pageName) return;
        fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBannerImages(Array(5).fill("").map((_, i) => data[0].image_urls[i] || ""));
                    setBannerLinks(Array(5).fill("").map((_, i) => data[0].link_urls?.[i] || ""));
                } else {
                    setBannerImages(Array(5).fill(""));
                    setBannerLinks(Array(5).fill(""));
                }
            })
            .catch(() => { setBannerImages(Array(5).fill("")); setBannerLinks(Array(5).fill("")); });
    }, [pageName]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Upload Banner Images</h2>
            <div>
                <Label htmlFor="pageName">Page Name *</Label>
                {/* Combobox for selecting or adding page name */}
                <PageNameComboBox pageName={pageName} setPageName={setPageName} />
            </div>
            <form onSubmit={handleSaveBanners} className="space-y-6">
                {[0, 1, 2, 3, 4].map(idx => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <Label htmlFor={`bannerImage${idx}`} className="text-sm font-medium">
                            {idx === 0 ? "Primary Banner" : idx === 1 ? "Secondary Banner" : "Third Banner (optional)"}
                        </Label>
                        <div className="space-y-2 mt-2">
                            <div className="flex gap-2">
                                <Input
                                    id={`bannerImage${idx}`}
                                    type="text"
                                    value={bannerImages[idx]}
                                    onChange={e => setBannerImages(prev => prev.map((img, i) => i === idx ? e.target.value : img))}
                                    placeholder="https://res.cloudinary.com/... or upload below"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => imageInputRefs[idx]?.current?.click()}
                                    disabled={isUploading[idx]}
                                    className="whitespace-nowrap"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {isUploading[idx] ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                            <BannerLinkBuilder
                                value={bannerLinks[idx]}
                                onChange={url => setBannerLinks(prev => prev.map((lnk, i) => i === idx ? url : lnk))}
                            />
                            {bannerImages[idx] && (
                                <div className="w-32 h-20 border rounded overflow-hidden">
                                            <img
                                                src={bannerImages[idx]}
                                                alt={`Banner ${idx + 1} preview`}
                                                className="w-full h-full object-cover"
                                                onError={e => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "https://via.placeholder.com/300x100?text=No+Image";
                                                }}
                                            />
                                </div>
                            )}
                        </div>
                        <input
                            ref={imageInputRefs[idx]}
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e, idx)}
                            className="hidden"
                        />
                    </div>
                ))}
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" className="bg-primary-aqua hover:bg-secondary-aqua" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Banners"}
                    </Button>
                </div>
            </form>
        </div>
    );
}



// Combobox component for page names
interface PageNameComboBoxProps {
    pageName: string;
    setPageName: (name: string) => void;
}
function PageNameComboBox({ pageName, setPageName }: PageNameComboBoxProps) {
    const [options, setOptions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>(pageName);
    const [isInput, setIsInput] = useState(false);

    useEffect(() => {
        fetch("/api/banner-page-types")
            .then(res => res.json())
            .then((pageTypes: string[]) => {
                setOptions(pageTypes);
            });
    }, []);

    useEffect(() => {
        if (inputValue && !options.includes(inputValue)) {
            setIsInput(true);
        } else {
            setIsInput(false);
        }
    }, [inputValue, options]);

    return (
        <div className="relative">
            {!isInput ? (
                <select
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={options.includes(pageName) ? pageName : ""}
                    onChange={e => {
                        if (e.target.value !== "new") {
                            setPageName(e.target.value);
                            setIsInput(false);
                            setInputValue(e.target.value);
                        } else {
                            setIsInput(true);
                            setInputValue("");
                        }
                    }}
                >
                    <option value="" disabled>Select existing page...</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="new">Add new Page</option>
                </select>
            ) : (
                <Input
                    id="pageNameInput"
                    value={inputValue}
                    placeholder="Or type new page name"
                    onChange={e => {
                        setInputValue(e.target.value);
                        setPageName(e.target.value);
                    }}
                    className="mt-1"
                    required
                />
            )}
        </div>
    );
}


// ─────────────────────────────────────────────────────────────
// BannerLinkBuilder — smart URL builder for banner destinations
// ─────────────────────────────────────────────────────────────

type BannerLinkType = "none" | "category" | "search" | "tag" | "price" | "coupon" | "custom";

const TAG_OPTIONS = [
    { key: "featured",   label: "Featured Books" },
    { key: "bestseller", label: "Bestsellers" },
    { key: "trending",   label: "Trending" },
    { key: "newArrival", label: "New Arrivals" },
    { key: "boxSet",     label: "Box Sets" },
] as const;

function parseUrlToLinkState(url: string) {
    const empty = { type: "none" as BannerLinkType, search: "", categoryId: "", tags: {} as Record<string, boolean>, minPrice: "", maxPrice: "", couponCode: "", custom: "" };
    if (!url) return empty;
    try {
        const u = new URL(url, "http://x");
        if (u.pathname === "/catalog" || u.pathname === "/books") {
            const search     = u.searchParams.get("search") || "";
            const categoryId = u.searchParams.get("categoryId") || "";
            const minPrice   = u.searchParams.get("minPrice") || "";
            const maxPrice   = u.searchParams.get("maxPrice") || "";
            const couponCode = u.searchParams.get("coupon") || "";
            const tags: Record<string, boolean> = {};
            TAG_OPTIONS.forEach(t => { if (u.searchParams.get(t.key) === "true") tags[t.key] = true; });
            if (couponCode) return { ...empty, type: "coupon" as BannerLinkType, couponCode };
            if (search)     return { ...empty, type: "search"   as BannerLinkType, search };
            if (categoryId) return { ...empty, type: "category" as BannerLinkType, categoryId };
            if (Object.keys(tags).length) return { ...empty, type: "tag" as BannerLinkType, tags };
            if (minPrice || maxPrice)     return { ...empty, type: "price" as BannerLinkType, minPrice, maxPrice };
        }
        if (u.pathname === "/checkout") {
            const couponCode = u.searchParams.get("coupon") || "";
            if (couponCode) return { ...empty, type: "coupon" as BannerLinkType, couponCode };
        }
        return { ...empty, type: "custom" as BannerLinkType, custom: url };
    } catch {
        return { ...empty, type: "custom" as BannerLinkType, custom: url };
    }
}

interface BannerLinkBuilderProps {
    value: string;
    onChange: (url: string) => void;
}

function BannerLinkBuilder({ value, onChange }: BannerLinkBuilderProps) {
    const [linkType,      setLinkType]      = useState<BannerLinkType>("none");
    const [searchTerm,    setSearchTerm]    = useState("");
    const [categoryId,    setCategoryId]    = useState("");
    const [selectedTags,  setSelectedTags]  = useState<Record<string, boolean>>({});
    const [minPrice,      setMinPrice]      = useState("");
    const [maxPrice,      setMaxPrice]      = useState("");
    const [couponCode,    setCouponCode]    = useState("");
    const [customUrl,     setCustomUrl]     = useState("");
    const [categories,    setCategories]    = useState<{ id: number; name: string }[]>([]);
    const [activeCoupons, setActiveCoupons] = useState<{ id: number; code: string; discountType: string; discountValue: string; description: string }[]>([]);

    // Track the last URL we built ourselves so we can tell external vs internal changes
    const lastBuiltUrl = useRef<string | null>(null);

    // Fetch categories + active coupons once
    useEffect(() => {
        fetch("/api/categories").then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
        fetch("/api/admin/coupons", { credentials: "include" })
            .then(r => r.json())
            .then(d => setActiveCoupons(Array.isArray(d) ? d.filter((c: any) => c.isActive) : []))
            .catch(() => {});
    }, []);

    // Re-parse whenever value changes externally (e.g. parent loads saved data from API)
    useEffect(() => {
        // Skip if this value is one we just built ourselves (internal change)
        if (lastBuiltUrl.current === value) return;
        const p = parseUrlToLinkState(value);
        setLinkType(p.type);
        setSearchTerm(p.search);
        setCategoryId(p.categoryId);
        setSelectedTags(p.tags);
        setMinPrice(p.minPrice);
        setMaxPrice(p.maxPrice);
        setCouponCode(p.couponCode);
        setCustomUrl(p.custom);
    }, [value]);

    // Build URL from state → push to parent
    useEffect(() => {
        let url = "";
        switch (linkType) {
            case "none":     url = ""; break;
            case "search":   url = searchTerm.trim() ? `/catalog?search=${encodeURIComponent(searchTerm.trim())}` : ""; break;
            case "category": url = categoryId ? `/catalog?categoryId=${categoryId}` : ""; break;
            case "tag": {
                const p = new URLSearchParams();
                Object.entries(selectedTags).forEach(([k, v]) => { if (v) p.set(k, "true"); });
                url = p.toString() ? `/catalog?${p.toString()}` : "";
                break;
            }
            case "price": {
                const p = new URLSearchParams();
                if (minPrice) p.set("minPrice", minPrice);
                if (maxPrice) p.set("maxPrice", maxPrice);
                url = p.toString() ? `/catalog?${p.toString()}` : "";
                break;
            }
            case "coupon": url = couponCode ? `/catalog?coupon=${encodeURIComponent(couponCode)}` : ""; break;
            case "custom":  url = customUrl; break;
        }
        lastBuiltUrl.current = url;
        onChange(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkType, searchTerm, categoryId, selectedTags, minPrice, maxPrice, couponCode, customUrl]);

    const toggleTag = (key: string) =>
        setSelectedTags(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">When banner is clicked, go to…</Label>

            {/* Link type selector */}
            <select
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                value={linkType}
                onChange={e => setLinkType(e.target.value as BannerLinkType)}
            >
                <option value="none">— No link (banner is not clickable) —</option>
                <option value="category">Browse a Category</option>
                <option value="search">Search for specific books / publisher</option>
                <option value="tag">Collection — Bestsellers / New Arrivals / Trending…</option>
                <option value="price">Books in a Price Range</option>
                <option value="coupon">Coupon Code Offer (saved while browsing, applied at checkout)</option>
                <option value="custom">Custom URL</option>
            </select>

            {/* Category picker */}
            {linkType === "category" && (
                <div>
                    <Label className="text-xs text-slate-500">Select Category</Label>
                    <select
                        className="w-full border rounded px-2 py-1.5 text-sm bg-white mt-1"
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                    >
                        <option value="">— Pick a category —</option>
                        {categories.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Search keyword */}
            {linkType === "search" && (
                <div>
                    <Label className="text-xs text-slate-500">Search Keyword</Label>
                    <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="e.g.  DM Publications  or  harry potter"
                        className="text-sm mt-1"
                    />
                    <p className="text-xs text-slate-400 mt-1">All books matching this keyword will be shown when clicked.</p>
                </div>
            )}

            {/* Collection tags */}
            {linkType === "tag" && (
                <div>
                    <Label className="text-xs text-slate-500">Collection Tag(s) — select one or more</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {TAG_OPTIONS.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => toggleTag(t.key)}
                                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                                    selectedTags[t.key]
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                                }`}
                            >
                                {selectedTags[t.key] ? "✓ " : ""}{t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Price range */}
            {linkType === "price" && (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <Label className="text-xs text-slate-500">Min Price ($)</Label>
                        <Input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" type="number" min="0" className="text-sm mt-1" />
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs text-slate-500">Max Price ($)</Label>
                        <Input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="e.g. 20" type="number" min="0" className="text-sm mt-1" />
                    </div>
                </div>
            )}

            {/* Coupon selector */}
            {linkType === "coupon" && (
                <div>
                    <Label className="text-xs text-slate-500">Active Coupon Code</Label>
                    <select
                        className="w-full border rounded px-2 py-1.5 text-sm bg-white mt-1"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                    >
                        <option value="">— Select a coupon —</option>
                        {activeCoupons.map(c => (
                            <option key={c.id} value={c.code}>
                                {c.code} — {c.discountType === "percentage" ? `${c.discountValue}% off` : `$${c.discountValue} off`}{c.description ? ` · ${c.description}` : ""}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">User browses the catalog with a coupon banner — the code is saved automatically and pre-filled at checkout.</p>
                </div>
            )}

            {/* Custom URL */}
            {linkType === "custom" && (
                <div>
                    <Label className="text-xs text-slate-500">Custom URL</Label>
                    <Input
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        placeholder="/catalog?search=...  or  /catalog?categoryId=5"
                        className="text-sm font-mono mt-1"
                    />
                </div>
            )}

            {/* Generated URL preview */}
            {linkType !== "none" && value && (
                <div className="flex items-start gap-2 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                    <span className="text-slate-400 shrink-0 mt-0.5">URL →</span>
                    <span className="font-mono text-slate-600 break-all">{value}</span>
                </div>
            )}
        </div>
    );
}