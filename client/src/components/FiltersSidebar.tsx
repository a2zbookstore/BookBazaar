import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Category, SubCategory } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import {
  X, ChevronDown, SlidersHorizontal,
  Tag, Layers, BadgeCheck, RotateCcw, Check,
  TrendingUp, Award, Star, Package, Zap, Flame,
} from 'lucide-react';

// ─── Condition dot colors ────────────────────────────────────────────────────
const COND_DOT: Record<string, string> = {
  'New':       'bg-amber-400',
  'Like New':  'bg-emerald-400',
  'Very Good': 'bg-teal-400',
  'Good':      'bg-blue-400',
  'Fair':      'bg-orange-400',
  'Acceptable':'bg-violet-400',
  'Poor':      'bg-gray-400',
};

// ─── Book tag config ─────────────────────────────────────────────────────────
const BOOK_TAGS = [
  { key: 'bestseller', label: 'Bestseller',  icon: Award,      selBg: 'bg-amber-500',   hoverCls: 'hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'    },
  { key: 'trending',   label: 'Trending',    icon: TrendingUp, selBg: 'bg-rose-500',    hoverCls: 'hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'        },
  { key: 'newArrival', label: 'New Arrival', icon: Zap,        selBg: 'bg-sky-500',     hoverCls: 'hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20'            },
  { key: 'featured',   label: 'Featured',    icon: Star,       selBg: 'bg-violet-500',  hoverCls: 'hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20' },
  { key: 'boxSet',     label: 'Box Set',     icon: Package,    selBg: 'bg-teal-500',    hoverCls: 'hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'        },
] as const;

// ─── Currency-aware price limits ─────────────────────────────────────────────
const CURRENCY_MAX: Record<string, number> = {
  USD: 500, EUR: 500, GBP: 400,  INR: 50000, JPY: 75000,
  CNY: 3500, CAD: 700, AUD: 700,  KRW: 700000, SGD: 700,
  HKD: 4000, NOK: 5000, SEK: 5000, DKK: 4000, CHF: 500,
};
const CURRENCY_STEP: Record<string, number> = {
  USD: 10, EUR: 10, GBP: 10,   INR: 500, JPY: 1000,
  CNY: 50, CAD: 10, AUD: 10,   KRW: 10000, SGD: 10,
  HKD: 50, NOK: 50, SEK: 50,   DKK: 50, CHF: 10,
};

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  label, iconEl, count, isOpen, onToggle,
}: {
  label: string;
  iconEl: React.ReactNode;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="w-full flex items-center justify-between py-3 group" onClick={onToggle}>
      <div className="flex items-center gap-2.5">
        <span className="h-7 w-7 rounded-lg flex items-center justify-center ring-1 ring-gray-100 dark:ring-gray-700 bg-white dark:bg-gray-800 group-hover:ring-[hsl(188,100%,70%)] dark:group-hover:ring-teal-600 transition-all">
          {iconEl}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          {label}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] bg-[hsl(188,100%,29%)] text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center leading-tight">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        className={`h-4 w-4 text-gray-300 dark:text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface AppliedFilters {
  categories: string[];
  subcategories: string[];
  conditions: string[];
  tags: string[];
  minPrice: string; // always USD
  maxPrice: string; // always USD
}

interface FiltersSidebarProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  categories: Category[];
  selectedCategories: string[];
  subcategories?: SubCategory[];
  selectedSubCategories?: string[];
  minPrice: string;
  maxPrice: string;
  conditions: string[];
  selectedConditions: string[];
  selectedTags?: string[];
  onClearFilters: () => void;
  onApplyFilters: (filters: AppliedFilters) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function FiltersSidebar({
  showFilters, onToggleFilters,
  categories, selectedCategories,
  subcategories = [], selectedSubCategories = [],
  minPrice, maxPrice,
  conditions, selectedConditions,
  selectedTags = [],
  onClearFilters, onApplyFilters,
}: FiltersSidebarProps) {

  // ── Currency ─────────────────────────────────────────────────────────────
  const { userCurrency, exchangeRates } = useCurrency();
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === userCurrency)?.symbol ?? '$';
  const maxPriceCur  = CURRENCY_MAX[userCurrency]  ?? 500;
  const priceStep    = CURRENCY_STEP[userCurrency] ?? 10;

  // Convert a USD string (stored in URL) → display currency string
  const toDisplay = (usdVal: string): string => {
    if (!usdVal || userCurrency === 'USD' || !exchangeRates) return usdVal;
    const rate = exchangeRates[userCurrency] ?? 1;
    return String(Math.round(Number(usdVal) * rate));
  };
  // Convert a display-currency string → USD string (for storing in URL / sending to API)
  const fromDisplay = (displayVal: string): string => {
    if (!displayVal || userCurrency === 'USD' || !exchangeRates) return displayVal;
    const rate = exchangeRates[userCurrency] ?? 1;
    return String(Math.round((Number(displayVal) / rate) * 100) / 100);
  };

  // ── Temporary (uncommitted) state ────────────────────────────────────────
  const [tempCats,  setTempCats]  = useState<string[]>(selectedCategories);
  const [tempSubs,  setTempSubs]  = useState<string[]>(selectedSubCategories);
  const [tempConds, setTempConds] = useState<string[]>(selectedConditions);
  // tempMin/tempMax are always in userCurrency (display values)
  const [tempMin,   setTempMin]   = useState(() => toDisplay(minPrice));
  const [tempMax,   setTempMax]   = useState(() => toDisplay(maxPrice));
  const [tempTags,  setTempTags]  = useState<string[]>(selectedTags);

  // Sync when parent resets or currency changes — re-convert USD→display
  useEffect(() => {
    setTempCats(selectedCategories);
    setTempSubs(selectedSubCategories);
    setTempConds(selectedConditions);
    setTempTags(selectedTags);
    setTempMin(toDisplay(minPrice));
    setTempMax(toDisplay(maxPrice));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSubCategories, selectedConditions, minPrice, maxPrice, selectedTags, userCurrency, exchangeRates]);

  // ── Accordion state ──────────────────────────────────────────────────────
  const [open, setOpen] = useState({ tags: true, category: true, subcategory: true, price: true, condition: true });
  const toggle = (key: keyof typeof open) => setOpen(p => ({ ...p, [key]: !p[key] }));

  // ── Filter toggling handlers ─────────────────────────────────────────────
  const handleCatToggle = (id: string) => {
    setTempSubs([]);
    setTempCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  };

  const handleSubToggle = (id: string) => {
    setTempSubs(p => p.includes(id) ? [] : [id]);
  };

  const handleCondToggle = (cond: string) => {
    setTempConds(p => p.includes(cond) ? p.filter(c => c !== cond) : [...p, cond]);
  };

  const handleTagToggle = (key: string) => {
    setTempTags(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
  };

  // ── Price slider ─────────────────────────────────────────────────────────
  const sliderVal: [number, number] = [
    tempMin ? Math.min(Number(tempMin), maxPriceCur) : 0,
    tempMax ? Math.min(Number(tempMax), maxPriceCur) : maxPriceCur,
  ];

  const handleSliderChange = ([lo, hi]: number[]) => {
    setTempMin(lo === 0 ? '' : String(lo));
    setTempMax(hi === maxPriceCur ? '' : String(hi));
  };

  // ── Active filter tags ───────────────────────────────────────────────────
  type FilterTag = { label: string; remove: () => void };
  const activeTags: FilterTag[] = [
    ...tempTags.map(key => {
      const t = BOOK_TAGS.find(b => b.key === key);
      return { label: t?.label ?? key, remove: () => setTempTags(p => p.filter(k => k !== key)) };
    }),
    ...tempCats.map(id => {
      const cat = categories.find(c => c.id.toString() === id);
      return { label: cat?.name ?? id, remove: () => setTempCats(p => p.filter(x => x !== id)) };
    }),
    ...tempSubs.map(id => {
      const sub = subcategories.find(s => s.id.toString() === id);
      return { label: sub?.name ?? id, remove: () => setTempSubs(p => p.filter(x => x !== id)) };
    }),
    ...tempConds.map(c => ({
      label: c,
      remove: () => setTempConds(p => p.filter(x => x !== c)),
    })),
    ...(tempMin || tempMax
      ? [{ label: `${currencySymbol}${tempMin || '0'} – ${tempMax ? currencySymbol + tempMax : 'any'}`, remove: () => { setTempMin(''); setTempMax(''); } }]
      : []),
  ];

  const activeCount = tempCats.length + tempSubs.length + tempConds.length + tempTags.length + (tempMin || tempMax ? 1 : 0);

  // ── Apply / Clear ────────────────────────────────────────────────────────
  const handleApply = () => {
    onApplyFilters({
      categories: tempCats,
      subcategories: tempSubs,
      conditions: tempConds,
      tags: tempTags,
      minPrice: fromDisplay(tempMin),
      maxPrice: fromDisplay(tempMax),
    });
    onToggleFilters();
  };

  const handleClear = () => {
    setTempCats([]); setTempSubs([]); setTempConds([]); setTempMin(''); setTempMax(''); setTempTags([]);
    onClearFilters();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity"
          style={{ top: 'var(--header-height, 120px)' }}
          onClick={onToggleFilters}
        />
      )}

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 z-50 flex flex-col bg-white dark:bg-gray-950
          shadow-[4px_0_40px_rgba(0,0,0,0.15)] transform transition-transform
          duration-300 ease-out ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 340,
          top: 'var(--header-height, 120px)',
          height: 'calc(100vh - var(--header-height, 120px))',
        }}
      >
        {/* Left gradient accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[hsl(188,100%,29%)] via-cyan-400 to-blue-400" />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 bg-[hsl(188,100%,29%)] dark:bg-[hsl(188,100%,20%)]">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-white/80" />
            <span className="text-white font-bold text-sm tracking-widest uppercase">Filters</span>
            {activeCount > 0 && (
              <span className="bg-white text-[hsl(188,100%,29%)] text-[11px] font-black rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-sm">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onToggleFilters}
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* ── Active filter tags ───────────────────────────────────────── */}
        {activeTags.length > 0 && (
          <div className="shrink-0 border-b border-gray-100 dark:border-gray-800 px-4 pt-2 pb-2">
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1.5">
              Active Filters
            </p>
            <div className="flex flex-wrap gap-1">
              {activeTags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 bg-[hsl(188,100%,95%)] dark:bg-[hsl(188,40%,12%)] text-[hsl(188,100%,24%)] dark:text-teal-300 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[hsl(188,60%,80%)] dark:border-teal-700/60 whitespace-nowrap"
                >
                  {tag.label}
                  <button onClick={tag.remove} className="hover:text-red-500 transition-colors leading-none flex-shrink-0 w-3 h-3 flex items-center justify-center">
                    <X className="h-2 w-2" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Scrollable filter body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 divide-y divide-gray-100 dark:divide-gray-800/80">

            {/* BROWSE BY TAGS */}
            <div>
              <SectionHeader
                label="Browse By"
                count={tempTags.length}
                isOpen={open.tags}
                onToggle={() => toggle('tags')}
                iconEl={<Flame className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />}
              />
              <div className={`overflow-hidden transition-all duration-300 ${open.tags ? 'max-h-36 pb-4' : 'max-h-0'}`}>
                <div className="flex flex-wrap gap-2">
                  {BOOK_TAGS.map(t => {
                    const sel = tempTags.includes(t.key);
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => handleTagToggle(t.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${
                          sel
                            ? `${t.selBg} text-white border-transparent shadow-sm`
                            : `bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 ${t.hoverCls}`
                        }`}
                      >
                        <Icon className="h-3 w-3 flex-shrink-0" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <div>
                <SectionHeader
                  label="Category"
                  count={tempCats.length}
                  isOpen={open.category}
                  onToggle={() => toggle('category')}
                  iconEl={<Tag className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
                />
                <div className={`overflow-hidden transition-all duration-300 ${open.category ? 'max-h-72 pb-4' : 'max-h-0'}`}>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                      const sel = tempCats.includes(cat.id.toString());
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCatToggle(cat.id.toString())}
                          className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all duration-150 select-none ${
                            sel
                              ? 'bg-[hsl(188,100%,29%)] text-white border-transparent shadow-sm scale-[1.03]'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBCATEGORIES */}
            {subcategories.length > 0 && (
              <div>
                <SectionHeader
                  label="Subcategory"
                  count={tempSubs.length}
                  isOpen={open.subcategory}
                  onToggle={() => toggle('subcategory')}
                  iconEl={<Layers className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />}
                />
                <div className={`overflow-hidden transition-all duration-300 ${open.subcategory ? 'max-h-56 pb-4' : 'max-h-0'}`}>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map(sub => {
                      const sel = tempSubs.includes(sub.id.toString());
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSubToggle(sub.id.toString())}
                          className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all duration-150 select-none ${
                            sel
                              ? 'bg-indigo-500 text-white border-transparent shadow-sm scale-[1.03]'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PRICE RANGE */}
            <div>
              <SectionHeader
                label={`Price (${userCurrency})`}
                count={(tempMin || tempMax) ? 1 : 0}
                isOpen={open.price}
                onToggle={() => toggle('price')}
                iconEl={<span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{currencySymbol}</span>}
              />
              <div className={`overflow-hidden transition-all duration-300 ${open.price ? 'max-h-44 pb-4' : 'max-h-0'}`}>
                {/* Dual-range slider */}
                <div className="px-1 mb-5 mt-1">
                  <Slider
                    min={0}
                    max={maxPriceCur}
                    step={priceStep}
                    value={sliderVal}
                    onValueChange={handleSliderChange}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">{currencySymbol}0</span>
                    <span className="text-[10px] text-gray-400">{currencySymbol}{maxPriceCur.toLocaleString()}</span>
                  </div>
                </div>
                {/* Min / Max inputs */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempMin}
                      onChange={e => setTempMin(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[hsl(188,100%,29%)] focus:border-transparent transition-all"
                    />
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-sm select-none">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempMax}
                      onChange={e => setTempMax(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[hsl(188,100%,29%)] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CONDITION */}
            {conditions.length > 0 && (
              <div>
                <SectionHeader
                  label="Condition"
                  count={tempConds.length}
                  isOpen={open.condition}
                  onToggle={() => toggle('condition')}
                  iconEl={<BadgeCheck className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />}
                />
                <div className={`overflow-hidden transition-all duration-300 ${open.condition ? 'max-h-32 pb-4' : 'max-h-0'}`}>
                  <div className="flex flex-wrap gap-1.5">
                    {conditions.map(cond => {
                      const sel = tempConds.includes(cond);
                      const dot = COND_DOT[cond] ?? 'bg-gray-400';
                      return (
                        <button
                          key={cond}
                          onClick={() => handleCondToggle(cond)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150 select-none ${
                            sel
                              ? 'bg-[hsl(188,100%,29%)] text-white border-transparent shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${sel ? 'bg-white' : dot}`} />
                          {cond}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5">
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={handleApply}
              disabled={
                tempCats.length === 0 &&
                tempConds.length === 0 &&
                tempTags.length === 0 &&
                !tempMin &&
                !tempMax
              }
              className="flex-1 py-2.5 rounded-xl bg-[hsl(188,100%,29%)] text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100 transition-all duration-200 shadow-md shadow-teal-200/50 dark:shadow-teal-900/40"
            >
              {activeCount > 0 ? `Apply (${activeCount})` : 'Apply Filters'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

