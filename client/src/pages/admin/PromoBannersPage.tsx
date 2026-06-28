import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, ToggleLeft, ToggleRight, Pencil, Check, X } from "lucide-react";

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

  const [allBanners, setAllBanners] = useState<PromoBanner[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({}); // id → name
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");

  // Group title edit state (one title shared across the group)
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState("");
  const [editGroupSaving, setEditGroupSaving] = useState(false);

  // Per-slot edit state (image / link / order only — title handled at group level)
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editSlotDraft, setEditSlotDraft] = useState<{ image_url: string; link_url: string; sort_order: number } | null>(null);
  const [editSlotSaving, setEditSlotSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [editUploading, setEditUploading] = useState(false);

  // New banner form
  const [formKey, setFormKey] = useState(0);
  const [title, setTitle] = useState(""); // only used for category placement
  const [groupName, setGroupName] = useState("");
  const [slots, setSlots] = useState([
    { imageUrl: "", linkUrl: "", uploading: false },
    { imageUrl: "", linkUrl: "", uploading: false },
    { imageUrl: "", linkUrl: "", uploading: false },
  ]);
  const slotRef0 = useRef<HTMLInputElement>(null);
  const slotRef1 = useRef<HTMLInputElement>(null);
  const slotRef2 = useRef<HTMLInputElement>(null);
  const slotRefs = [slotRef0, slotRef1, slotRef2];
  const [saving, setSaving] = useState(false);

  // Derived placement info
  const activePlacement = groupName === "home_strip" ? "home_strip"
    : groupName === "home_side" ? "home_side"
    : groupName.startsWith("category_") ? "category" : "";
  const slotCount = (activePlacement === "home_strip" || activePlacement === "category") ? 3
    : activePlacement === "home_side" ? 2 : 1;

  const loadBanners = () => {
    fetch("/api/admin/promo-banners", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAllBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const groupLabel = (g: string) => {
    if (g === "home_strip") return "Strip (below hero)";
    if (g === "home_side") return "Side panel";
    if (g.startsWith("category_")) return categoryMap[g] || g;
    return g;
  };

  const openGroupEdit = (groupName: string, banners: PromoBanner[]) => {
    const raw = banners[0]?.title || "";
    const base = raw.replace(/\s*—\s*\d+$/, "").trim();
    setEditingGroupName(groupName);
    setEditGroupTitle(base);
    setEditingSlotId(null);
    setEditSlotDraft(null);
  };
  const closeGroupEdit = () => { setEditingGroupName(null); setEditGroupTitle(""); };

  const handleGroupTitleSave = async (groupBanners: PromoBanner[]) => {
    if (!editingGroupName || !editGroupTitle.trim()) return;
    setEditGroupSaving(true);
    try {
      await Promise.all(groupBanners.map((b, i) => {
        const newTitle = groupBanners.length > 1 ? `${editGroupTitle.trim()} — ${i + 1}` : editGroupTitle.trim();
        return fetch(`/api/admin/promo-banners/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: newTitle }),
        }).then(r => { if (!r.ok) throw new Error(); return r.json(); });
      }));
      setAllBanners(prev => prev.map(b => {
        if (b.group_name !== editingGroupName) return b;
        const idx = groupBanners.findIndex(gb => gb.id === b.id);
        const newTitle = groupBanners.length > 1 ? `${editGroupTitle.trim()} — ${idx + 1}` : editGroupTitle.trim();
        return { ...b, title: newTitle };
      }));
      toast({ title: "Title updated!" });
      closeGroupEdit();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setEditGroupSaving(false);
    }
  };

  const openSlotEdit = (b: PromoBanner) => {
    setEditingSlotId(b.id);
    setEditSlotDraft({ image_url: b.image_url, link_url: b.link_url || "", sort_order: b.sort_order });
  };
  const closeSlotEdit = () => { setEditingSlotId(null); setEditSlotDraft(null); };

  const handleEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editSlotDraft) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
    setEditUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/admin/promo-banners/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error();
      const { imageUrl: url } = await res.json();
      setEditSlotDraft(d => d ? { ...d, image_url: url } : d);
      toast({ title: "Uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setEditUploading(false);
      if (editFileRef.current) editFileRef.current.value = "";
    }
  };

  const handleSlotSave = async () => {
    if (!editingSlotId || !editSlotDraft) return;
    if (!editSlotDraft.image_url.trim()) { toast({ title: "Image URL required", variant: "destructive" }); return; }
    setEditSlotSaving(true);
    try {
      const res = await fetch(`/api/admin/promo-banners/${editingSlotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image_url: editSlotDraft.image_url, link_url: editSlotDraft.link_url || null, sort_order: editSlotDraft.sort_order }),
      });
      if (!res.ok) throw new Error();
      const updated: PromoBanner = await res.json();
      setAllBanners(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast({ title: "Slot updated!" });
      closeSlotEdit();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setEditSlotSaving(false);
    }
  };

  useEffect(() => {
    loadBanners();
    fetch("/api/categories")
      .then(r => r.json())
      .then((cats: { id: number; name: string }[]) => {
        if (!Array.isArray(cats)) return;
        const map: Record<string, string> = {};
        cats.forEach(c => { map[`category_${c.id}`] = c.name; });
        setCategoryMap(map);
      })
      .catch(() => {});
  }, []);

  const handleSlotUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be < 5 MB.", variant: "destructive" }); return;
    }
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, uploading: true } : s));
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/admin/promo-banners/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error();
      const { imageUrl: url } = await res.json();
      setSlots(prev => prev.map((s, i) => i === idx ? { ...s, imageUrl: url, uploading: false } : s));
      toast({ title: "Uploaded", description: "Image ready." });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setSlots(prev => prev.map((s, i) => i === idx ? { ...s, uploading: false } : s));
    } finally {
      const ref = slotRefs[idx];
      if (ref.current) ref.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast({ title: "Missing group", description: "Please select where this banner appears.", variant: "destructive" }); return;
    }
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please enter a title for this banner set.", variant: "destructive" }); return;
    }
    const activeSlots = slots.slice(0, slotCount).filter(s => s.imageUrl.trim());
    if (activeSlots.length === 0) {
      toast({ title: "No images", description: "Please upload at least one banner image.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await Promise.all(
        activeSlots.map((slot) => {
          const slotIndex = slots.findIndex(s => s === slot);
          const savedTitle = slotCount > 1
            ? `${title.trim()} — ${slotIndex + 1}`
            : title.trim();
          return fetch("/api/admin/promo-banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: savedTitle,
              group_name: groupName.trim(),
              image_url: slot.imageUrl,
              link_url: slot.linkUrl || null,
              is_active: true,
              sort_order: slotIndex * 10,
            }),
          }).then(r => { if (!r.ok) throw new Error(); });
        })
      );
      toast({ title: activeSlots.length > 1 ? `${activeSlots.length} banners saved!` : "Banner saved!" });
      setTitle("");
      setGroupName("");
      setSlots([
        { imageUrl: "", linkUrl: "", uploading: false },
        { imageUrl: "", linkUrl: "", uploading: false },
        { imageUrl: "", linkUrl: "", uploading: false },
      ]);
      setFormKey(k => k + 1);
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
          {/* Group — always first */}
          <div>
            <Label>Banner Group *</Label>
            <p className="text-xs text-gray-500 mb-1">Choose where this banner should appear on the site.</p>
            <GroupSelector
              key={formKey}
              value={groupName}
              onChange={setGroupName}
              onCategoryName={(name) => { if (!title.trim()) setTitle(name); }}
            />
          </div>

          {/* Title — shown for all placements once a group is selected */}
          {activePlacement && (
            <div>
              <Label htmlFor="promoTitle">Banner Title *</Label>
              <p className="text-xs text-gray-500 mb-1">Shown in the admin list so you can identify this banner.</p>
              <Input
                id="promoTitle"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={activePlacement === "category" ? "e.g. Routledge Classics — 40% OFF" : activePlacement === "home_strip" ? "e.g. Summer Sale Strip" : "e.g. Featured Publishers"}
                required
                className="mt-1"
              />
            </div>
          )}

          {/* Image slots — shown only once a group is selected */}
          {slotCount > 0 && (
            <div className="space-y-3">
              {activePlacement === "home_strip" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  Upload up to <strong>3 images</strong> — they appear side-by-side in the strip below the hero.
                  Slots left blank are skipped. Left slot = position 1.
                </p>
              )}
              {activePlacement === "home_side" && (
                <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded px-3 py-2">
                  Upload <strong>2 images</strong> — they stack vertically to the right of the hero carousel on desktop.
                  Slots left blank are skipped. Top slot = position 1.
                </p>
              )}
              {activePlacement === "category" && (
                <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded px-3 py-2">
                  Upload up to <strong>3 images</strong> — they appear in a row at the top of the category page.
                  Slots left blank are skipped. Left slot = position 1.
                </p>
              )}

              {Array.from({ length: slotCount }).map((_, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  {slotCount > 1 && (
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {activePlacement === "home_side"
                        ? (idx === 0 ? "Banner 1 — Top" : "Banner 2 — Bottom")
                        : (idx === 0 ? "Banner 1 — Left" : idx === 1 ? "Banner 2 — Centre" : "Banner 3 — Right")}
                      {idx > 0 && <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={slots[idx].imageUrl}
                        onChange={e => setSlots(prev => prev.map((s, i) => i === idx ? { ...s, imageUrl: e.target.value } : s))}
                        placeholder="https://res.cloudinary.com/... or upload"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => slotRefs[idx].current?.click()}
                        disabled={slots[idx].uploading}
                        className="whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {slots[idx].uploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    <BannerLinkBuilder
                      value={slots[idx].linkUrl}
                      onChange={url => setSlots(prev => prev.map((s, i) => i === idx ? { ...s, linkUrl: url } : s))}
                    />
                    {slots[idx].imageUrl && (
                      <div className="w-32 h-20 border rounded overflow-hidden">
                        <img
                          src={slots[idx].imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x100?text=No+Image"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Hidden file inputs — one per slot */}
              <input ref={slotRef0} type="file" accept="image/*" onChange={e => handleSlotUpload(0, e)} className="hidden" />
              <input ref={slotRef1} type="file" accept="image/*" onChange={e => handleSlotUpload(1, e)} className="hidden" />
              <input ref={slotRef2} type="file" accept="image/*" onChange={e => handleSlotUpload(2, e)} className="hidden" />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-primary-aqua hover:bg-secondary-aqua" disabled={saving || !groupName}>
              {saving ? "Saving..." : slotCount === 3 ? "Save All 3 Banners" : slotCount === 2 ? "Save Both Banners" : "Save Banner"}
            </Button>
          </div>
        </form>

        {/* ── All banners list ── */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold">All Promo Banners — On / Off</h3>
            <div className="ml-auto flex gap-1 flex-wrap">
              {["all", "home_strip", "home_side"].concat(
                [...new Set(allBanners.filter(b => b.group_name.startsWith("category_")).map(b => b.group_name))]
              ).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGroup(g)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filterGroup === g
                      ? "bg-primary-aqua text-white border-primary-aqua"
                      : "bg-white text-gray-600 border-gray-300 hover:border-primary-aqua"
                  }`}
                >
                  {g === "all" ? "All" : groupLabel(g)}
                  {g !== "all" && (
                    <span className="ml-1 opacity-70">
                      ({allBanners.filter(b => b.group_name === g).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {filterGroup === "home_strip" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
              <strong>Home Strip</strong> — shows up to 3 banners in a row directly below the hero carousel.
              Lower <em>Display Order</em> = appears first. Only <strong>ON</strong> banners are shown on the homepage.
            </p>
          )}
          {(() => {
            const filtered = filterGroup === "all" ? allBanners : allBanners.filter(b => b.group_name === filterGroup);
            if (filtered.length === 0) return (
              <p className="text-sm text-gray-400">{allBanners.length === 0 ? "No promo banners uploaded yet." : "No banners in this group."}</p>
            );

            // Group by group_name, preserve insertion order
            const groupOrder: string[] = [];
            const groups: Record<string, PromoBanner[]> = {};
            filtered.forEach(b => {
              if (!groups[b.group_name]) { groups[b.group_name] = []; groupOrder.push(b.group_name); }
              groups[b.group_name].push(b);
            });

            return (
              <div className="space-y-3">
                {groupOrder.map(gName => {
                  const groupBanners = groups[gName].sort((a, b) => a.sort_order - b.sort_order);
                  const baseTitle = (groupBanners[0]?.title || "").replace(/\s*—\s*\d+$/, "").trim();
                  const isEditingTitle = editingGroupName === gName;

                  return (
                    <div key={gName} className="border rounded-lg overflow-hidden">
                      {/* ── Group header ── */}
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b">
                        <div className="flex-1 min-w-0">
                          {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editGroupTitle}
                                onChange={e => setEditGroupTitle(e.target.value)}
                                className="h-7 text-sm py-0 w-56"
                                autoFocus
                                onKeyDown={e => { if (e.key === "Enter") handleGroupTitleSave(groupBanners); if (e.key === "Escape") closeGroupEdit(); }}
                              />
                              <button onClick={() => handleGroupTitleSave(groupBanners)} disabled={editGroupSaving}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50" aria-label="Save title">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={closeGroupEdit} className="text-gray-400 hover:text-gray-600" aria-label="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-gray-700 truncate">{baseTitle}</span>
                              <button onClick={() => openGroupEdit(gName, groupBanners)}
                                className="text-gray-400 hover:text-primary-aqua shrink-0" aria-label="Edit title">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{groupLabel(gName)} · {groupBanners.length} slot{groupBanners.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {/* ── Slots ── */}
                      <div className="divide-y">
                        {groupBanners.map((banner, slotIdx) => (
                          <div key={banner.id} className="bg-white">
                            <div className="flex items-center gap-3 px-4 py-2.5">
                              {/* Thumbnail */}
                              {banner.image_url && (
                                <img src={banner.image_url} alt="" className="w-14 h-9 object-cover rounded shrink-0" />
                              )}
                              {/* Slot info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">
                                  {groupBanners.length > 1
                                    ? (slotIdx === 0 ? "Slot 1" : slotIdx === 1 ? "Slot 2" : "Slot 3")
                                    : "Single banner"}
                                  <span className="ml-2 text-gray-300">· order: {banner.sort_order}</span>
                                </p>
                                {banner.link_url && (
                                  <p className="text-xs text-primary-aqua truncate font-mono">{banner.link_url}</p>
                                )}
                              </div>
                              {/* Status */}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {banner.is_active ? "ON" : "OFF"}
                              </span>
                              {/* Edit slot */}
                              <button
                                onClick={() => editingSlotId === banner.id ? closeSlotEdit() : openSlotEdit(banner)}
                                className={`shrink-0 transition-colors ${editingSlotId === banner.id ? "text-primary-aqua" : "text-gray-400 hover:text-primary-aqua"}`}
                                aria-label="Edit slot"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {/* Toggle */}
                              <button onClick={() => handleToggle(banner)} disabled={togglingId === banner.id}
                                className="text-gray-400 hover:text-primary-aqua transition-colors disabled:opacity-50 shrink-0">
                                {banner.is_active ? <ToggleRight className="h-7 w-7 text-green-500" /> : <ToggleLeft className="h-7 w-7 text-gray-400" />}
                              </button>
                              {/* Delete */}
                              <button onClick={() => handleDelete(banner)} disabled={deletingId === banner.id}
                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Slot edit panel */}
                            {editingSlotId === banner.id && editSlotDraft && (
                              <div className="border-t bg-gray-50 px-4 py-3 space-y-3">
                                <div>
                                  <Label className="text-xs">Image URL</Label>
                                  <div className="flex gap-2 mt-1">
                                    <Input value={editSlotDraft.image_url}
                                      onChange={e => setEditSlotDraft(d => d ? { ...d, image_url: e.target.value } : d)}
                                      className="flex-1 text-sm font-mono" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => editFileRef.current?.click()} disabled={editUploading}>
                                      <Upload className="h-3.5 w-3.5 mr-1" />{editUploading ? "..." : "Upload"}
                                    </Button>
                                  </div>
                                  {editSlotDraft.image_url && (
                                    <img src={editSlotDraft.image_url} alt="" className="mt-2 w-28 h-16 object-cover rounded border"
                                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs">Link URL <span className="font-normal text-gray-400">(optional)</span></Label>
                                  <Input value={editSlotDraft.link_url}
                                    onChange={e => setEditSlotDraft(d => d ? { ...d, link_url: e.target.value } : d)}
                                    placeholder="/catalog?categoryId=5" className="mt-1 text-sm font-mono" />
                                </div>
                                <div>
                                  <Label className="text-xs">Display Order</Label>
                                  <Input type="number" min={0} value={editSlotDraft.sort_order}
                                    onChange={e => setEditSlotDraft(d => d ? { ...d, sort_order: parseInt(e.target.value) || 0 } : d)}
                                    className="mt-1 text-sm w-24" />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <Button size="sm" onClick={handleSlotSave} disabled={editSlotSaving} className="bg-primary-aqua hover:bg-secondary-aqua gap-1">
                                    <Check className="h-3.5 w-3.5" />{editSlotSaving ? "Saving..." : "Save"}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={closeSlotEdit} className="gap-1">
                                    <X className="h-3.5 w-3.5" />Cancel
                                  </Button>
                                </div>
                                <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditUpload} className="hidden" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
    </div>
  );
}
