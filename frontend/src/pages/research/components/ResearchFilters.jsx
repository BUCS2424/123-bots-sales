import React from 'react';
import { Search, X } from 'lucide-react';

export const ResearchFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onClearFilters,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm" data-testid="research-filters-panel">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-11 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
            data-testid="research-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-900 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              data-testid="research-search-clear-button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
            data-testid="research-category-select"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            data-testid="research-clear-filters-button"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
