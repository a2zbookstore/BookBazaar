import React from "react";
import CategoriesManagement from "@/components/admin/CategoriesManagement";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500 p-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-indigo-100 text-sm mt-0.5">
            Manage book categories, subcategories and homepage visibility
          </p>
        </div>
      </div>

      <CategoriesManagement />
    </div>
  );
}

