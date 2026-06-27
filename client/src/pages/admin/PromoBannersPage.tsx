import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// BannerLinkBuilder — copied from BannerUploadPage for consistency
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
  const [linkType,     setLinkType]     = useState<BannerLinkType>("none");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [categoryId,   setCategoryId]   = useState("");
  const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({});
  const [minPrice,     setMinPrice]     = useState("");
  const [maxPrice,     setMaxPrice]     = useState("");
  const [couponCode,   setCouponCode]   = useState("");
  const [customUrl,    setCustomUrl]    = useState("");
  const [categories,   setCategories]   = useState<{ id: number; name: string }[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<{ id: number; code: string; discountType: string; discountValue: string; description: string }[]>([]);
  const lastBuiltUrl = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/coupons", { credentials: "include" })
      .then(r => r.json())
      .then(d => setActiveCoupons(Array.isArray(d) ? d.filter((c: any) => c.isActive) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (lastBuiltUrl.current === value) return;
    const p = parseUrlToLinkState(value);
    setLinkType(p.type); setSearchTerm(p.search); setCategoryId(p.categoryId);
    setSelectedTags(p.tags); setMinPrice(p.minPrice); setMaxPrice(p.maxPrice);
    setCouponCode(p.couponCode); setCustomUrl(p.custom);
  }, [value]);

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

  const toggleTag = (key: string) => setSelectedTags(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">When banner is clicked, go to…</Label>
      <select className="w-full border rounded px-2 py-1.5 text-sm bg-white" value={linkType} onChange={e => setLinkType(e.target.value as BannerLinkType)}>
        <option value="none">— No link (banner is not clickable) —</option>
        <option value="category">Browse a Category</option>
        <option value="search">Search for specific books / publisher</option>
        <option value="tag">Collection — Bestsellers / New Arrivals / Trending…</option>
        <option value="price">Books in a Price Range</option>
        <option value="coupon">Coupon Code Offer</option>
        <option value="custom">Custom URL</option>
      </select>
      {linkType === "category" && (
        <div>
          <Label className="text-xs text-slate-500">Select Category</Label>
          <select className="w-full border rounded px-2 py-1.5 text-sm bg-white mt-1" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">— Pick a category —</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
      )}
      {linkType === "search" && (
        <div>
          <Label className="text-xs text-slate-500">Search Keyword</Label>
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="e.g. DM Publications or harry potter" className="text-sm mt-1" />
        </div>
      )}
      {linkType === "tag" && (
        <div>
          <Label className="text-xs text-slate-500">Collection Tag(s)</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TAG_OPTIONS.map(t => (
              <button key={t.key} type="button" onClick={() => toggleTag(t.key)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${selectedTags[t.key] ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"}`}>
                {selectedTags[t.key] ? "✓ " : ""}{t.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {linkType === "price" && (
        <div className="flex gap-3">
          <div className="flex-1"><Label className="text-xs text-slate-500">Min Price ($)</Label><Input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" type="number" min="0" className="text-sm mt-1" /></div>
          <div className="flex-1"><Label className="text-xs text-slate-500">Max Price ($)</Label><Input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="e.g. 20" type="number" min="0" className="text-sm mt-1" /></div>
        </div>
      )}
      {linkType === "coupon" && (
        <div>
          <Label className="text-xs text-slate-500">Active Coupon Code</Label>
          <select className="w-full border rounded px-2 py-1.5 text-sm bg-white mt-1" value={couponCode} onChange={e => setCouponCode(e.target.value)}>
            <option value="">— Select a coupon —</option>
            {activeCoupons.map(c => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.discountType === "percentage" ? `${c.discountValue}% off` : `$${c.discountValue} off`}{c.description ? ` · ${c.description}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {linkType === "custom" && (
        <div>
          <Label className="text-xs text-slate-500">Custom URL</Label>
          <Input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="/catalog?search=...  or  /catalog?categoryId=5" className="text-sm font-mono mt-1" />
        </div>
      )}
      {linkType !== "none" && value && (
        <div className="flex items-start gap-2 text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
          <span className="text-slate-400 shrink-0 mt-0.5">URL →</span>
          <span className="font-mono text-slate-600 break-all">{value}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GroupSelector — two-step: placement type → category (if needed)
// ─────────────────────────────────────────────────────────────
type PlacementType = "" | "home_side" | "home_strip" | "category";

function GroupSelector({ value, onChange, onCategoryName }: { value: string; onChange: (v: string) => void; onCategoryName?: (name: string) => void }) {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Derive initial placement type from an existing value
  const derivePlacement = (v: string): PlacementType => {
    if (v === "home_side") return "home_side";
    if (v === "home_strip") return "home_strip";
    if (v.startsWith("category_")) return "category";
    return "";
  };  

  const [placement, setPlacement] = useState<PlacementType>(() => derivePlacement(value));
  // category id extracted from value like "category_5"
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() =>
    value.startsWith("category_") ? value.replace("category_", "") : ""
  );

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handlePlacementChange = (p: PlacementType) => {
    setPlacement(p);
    setSelectedCategoryId("");
    if (p === "home_side" || p === "home_strip") {
      onChange(p);
    } else {
      // category — wait for second step
      onChange("");
    }
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    onChange(catId ? `category_${catId}` : "");
    if (catId && onCategoryName) {
      const cat = categories.find(c => String(c.id) === catId);
      if (cat) onCategoryName(cat.name);
    }
  };

  const placementOptions: { value: PlacementType; label: string; description: string }[] = [
    { value: "home_side",  label: "Home — Side panel",    description: "Appears to the right of the hero carousel on the homepage" },
    { value: "home_strip", label: "Home — Strip below hero", description: "Full-width strip directly below the hero carousel" },
    { value: "category",   label: "Category page banner", description: "Shown at the top of a specific category page" },
  ];

  return (
    <div className="space-y-3">
      {/* Step 1: placement type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {placementOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePlacementChange(opt.value)}
            className={`text-left border rounded-lg px-3 py-2.5 transition-all text-sm ${
              placement === opt.value
                ? "border-primary-aqua bg-primary-aqua/10 text-primary-aqua font-semibold"
                : "border-gray-200 bg-white hover:border-primary-aqua/50 text-gray-700"
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-normal">{opt.description}</div>
          </button>
        ))}
      </div>

      {/* Step 2: category picker (only when "category" is selected) */}
      {placement === "category" && (
        <div>
          <Label className="text-sm text-gray-700 mb-1 block">Which category? *</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">Loading categories…</p>
          ) : (
            <select
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              value={selectedCategoryId}
              onChange={e => handleCategoryChange(e.target.value)}
              required
            >
              <option value="" disabled>Select a category…</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          )}
          {selectedCategoryId && (
            <p className="text-xs text-gray-400 mt-1">Group key: <span className="font-mono">category_{selectedCategoryId}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
interface PromoBanner {
  id: number;
  title: string;
  group_name: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function PromoBannersPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [allBanners, setAllBanners] = useState<PromoBanner[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // New banner form
  const [title, setTitle] = useState("");
  const [groupName, setGroupName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBanners = () => {
    fetch("/api/admin/promo-banners", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAllBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => { loadBanners(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be < 5 MB.", variant: "destructive" }); return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/admin/promo-banners/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error();
      const { imageUrl: url } = await res.json();
      setImageUrl(url);
      toast({ title: "Uploaded", description: "Image ready." });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !groupName.trim() || !imageUrl) {
      toast({ title: "Missing fields", description: "Title, group and image are all required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promo-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), group_name: groupName.trim(), image_url: imageUrl, link_url: linkUrl || null, is_active: true, sort_order: 0 }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Banner saved!" });
      setTitle(""); setGroupName(""); setImageUrl(""); setLinkUrl("");
      loadBanners();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: PromoBanner) => {
    setTogglingId(b.id);
    try {
      const res = await fetch(`/api/admin/promo-banners/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !b.is_active }),
      });
      if (!res.ok) throw new Error();
      const updated: PromoBanner = await res.json();
      setAllBanners(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast({ title: updated.is_active ? "Banner Enabled" : "Banner Disabled", description: `"${updated.title}" is now ${updated.is_active ? "visible" : "hidden"}.` });
    } catch {
      toast({ title: "Toggle failed", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (b: PromoBanner) => {
    if (!window.confirm(`Delete banner "${b.title}"? This cannot be undone.`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/admin/promo-banners/${b.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setAllBanners(prev => prev.filter(x => x.id !== b.id));
      toast({ title: "Banner Deleted", description: `"${b.title}" has been removed.` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold">Promo Banners</h2>

        {/* ── Upload form ── */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="promoTitle">Banner Title *</Label>
            <Input id="promoTitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Routledge Classics — 40% OFF" required className="mt-1" />
          </div>

          {/* Group */}
          <div>
            <Label>Banner Group *</Label>
            <p className="text-xs text-gray-500 mb-1">Choose where this banner should appear on the site.</p>
            <GroupSelector
              value={groupName}
              onChange={setGroupName}
              onCategoryName={(name) => { if (!title.trim()) setTitle(name); }}
            />
          </div>

          {/* Image */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label htmlFor="promoImage" className="text-sm font-medium">Banner Image *</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input
                  id="promoImage"
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or upload below"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="whitespace-nowrap">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {/* Link builder */}
              <BannerLinkBuilder value={linkUrl} onChange={setLinkUrl} />

              {/* Preview */}
              {imageUrl && (
                <div className="w-32 h-20 border rounded overflow-hidden">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x100?text=No+Image"; }} />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-primary-aqua hover:bg-secondary-aqua" disabled={saving}>
              {saving ? "Saving..." : "Save Banner"}
            </Button>
          </div>
        </form>

        {/* ── All banners list ── */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-3">All Promo Banners — On / Off</h3>
          {allBanners.length === 0 ? (
            <p className="text-sm text-gray-400">No promo banners uploaded yet.</p>
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {allBanners.map(banner => (
                <div key={banner.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  {/* Thumbnail */}
                  {banner.image_url && (
                    <img src={banner.image_url} alt="" className="w-16 h-10 object-cover rounded shrink-0" />
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{banner.title}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{banner.group_name}</p>
                  </div>
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {banner.is_active ? "ON" : "OFF"}
                  </span>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(banner)}
                    disabled={togglingId === banner.id}
                    className="text-gray-400 hover:text-primary-aqua transition-colors disabled:opacity-50 shrink-0"
                    aria-label={banner.is_active ? "Disable" : "Enable"}
                  >
                    {banner.is_active
                      ? <ToggleRight className="h-8 w-8 text-green-500" />
                      : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={deletingId === banner.id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                    aria-label="Delete banner"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
