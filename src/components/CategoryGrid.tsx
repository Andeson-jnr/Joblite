import React, { useState } from 'react';
import {
  Wrench,
  Zap,
  Cpu,
  Snowflake,
  Hammer,
  Armchair,
  Layers,
  Grid,
  Paintbrush,
  Flame,
  Boxes,
  Car,
  Bike,
  Smartphone,
  Laptop,
  Scissors,
  Sparkles,
  Smile,
  Eye,
  Utensils,
  Camera,
  Video,
  Shirt,
  Tv,
  Printer,
  PenTool,
  Flower,
  Home,
  Building,
  TreePine,
  ShieldAlert,
  Truck,
  MoreHorizontal,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ServiceCategory } from '../types';

interface CategoryGridProps {
  categories: ServiceCategory[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Wrench,
  Zap,
  Cpu,
  Snowflake,
  Hammer,
  Armchair,
  Layers,
  Grid,
  Paintbrush,
  Flame,
  Boxes,
  Car,
  Bike,
  Smartphone,
  Laptop,
  Scissors,
  Sparkles,
  Smile,
  Eye,
  Utensils,
  Camera,
  Video,
  Sparkle: Sparkles,
  Shirt,
  Tv,
  Printer,
  PenTool,
  Flower,
  Home,
  Building,
  TreePine,
  ShieldAlert,
  Truck,
  MoreHorizontal,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-700 tracking-wider mb-1">
              Makurdi Service Catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Browse by Service Category
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Over 35 vetted skill trades available across Makurdi and Benue State
            </p>
          </div>

          {/* Search within categories */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category (e.g. welding, tiling)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName] || Wrench;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                id={`cat-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>{cat.artisanCount || 0} active</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
