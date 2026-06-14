import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Category } from "@/types";

export default function CategoryHeader() {
  const [location, setLocation] = useLocation();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const navigate = (path: string) => {
    setLocation(path);
  };

  const isActive = (path: string) =>
    location === path || location.startsWith(path + "&");

  const allItems: { label: string; path: string }[] = [
    { label: "SHOP ALL", path: "/catalog" },
    { label: "BEST SELLER", path: "/catalog?bestseller=true" },
    ...categories.map((cat) => ({
      label: cat.name.toUpperCase(),
      path: `/catalog?categoryId=${cat.id}`,
    })),
  ];

  // Duplicate items for seamless infinite loop
  const loopItems = [...allItems, ...allItems];

  const renderItem = (item: { label: string; path: string }, index: number) => (
    <div key={index} className="flex items-center flex-shrink-0">
      <span className="text-white/40 mx-3 select-none text-sm">|</span>
      <button
        type="button"
        onClick={() => navigate(item.path)}
        className={`text-white text-xs font-bold tracking-widest whitespace-nowrap py-2.5 transition-colors hover:text-yellow-300 cursor-pointer ${
          isActive(item.path) ? "text-yellow-300" : ""
        }`}
      >
        {item.label}
      </button>
    </div>
  );

  return (
    <div className="fixed left-0 right-0 z-30 bg-red-600 top-[122px] md:top-[100px] overflow-hidden marquee-container">
      <div className="animate-marquee">
        {loopItems.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}
