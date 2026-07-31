import React from 'react';
import { Filter } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 shrink-0 mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span>Categorías:</span>
      </div>

      <button
        onClick={() => onSelectCategory('Todas')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
          selectedCategory === 'Todas'
            ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
            : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <span>Todas</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            selectedCategory === 'Todas' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {categoryCounts['Todas'] || 0}
        </span>
      </button>

      {categories.map(cat => {
        const isSelected = selectedCategory === cat;
        const count = categoryCounts[cat] || 0;

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span>{cat}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
