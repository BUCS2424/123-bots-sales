import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResearchFilters } from './components/ResearchFilters';
import { ResearchArticleCard } from './components/ResearchArticleCard';
import { fetchResearchArticles, fetchResearchCategories, fetchResearchTags } from './researchApi';
import { setSeoMetadata } from '../../lib/seo';
import ButterflyIcon from '../../components/icons/ButterflyIcon';

const makeTagTestId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ResearchLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [articles, setArticles] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 9,
    has_more: false,
  });

  useEffect(() => {
    setSeoMetadata({
      title: 'Custom Printing & Sublimation Tips | 123Bots',
      description: 'Explore our collection of articles about custom printing, sublimation techniques, design tips, and product care guides.',
      keywords: 'sublimation printing, custom t-shirts, design tips, product care, 123Bots',
      canonicalPath: '/research',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '123Bots Design & Printing Tips',
        description: 'Browse articles about custom printing, sublimation, and product customization.',
      },
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryData, tagData] = await Promise.all([
          fetchResearchCategories(),
          fetchResearchTags(),
        ]);
        setCategories(categoryData);
        setTags(tagData);
      } catch (apiError) {
        console.error('Failed loading research filters', apiError);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchResearchArticles({
          page,
          limit: 9,
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
          search: debouncedSearch || undefined,
        });
        setArticles(response);
      } catch (apiError) {
        setError(apiError.response?.data?.detail || 'Unable to load research library right now.');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [page, selectedCategory, selectedTag, debouncedSearch]);

  const hasResults = useMemo(() => articles.items.length > 0, [articles.items.length]);

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-32" data-testid="research-library-page">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-cyan-50/50 to-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#ff8c42] border border-[#ff8c42]/30 mb-5" data-testid="research-library-kicker">
              <ButterflyIcon className="w-4 h-4" />
              INSPIRATION & IDEAS
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-slate-800 mb-5" data-testid="research-library-heading">
              Design Inspiration Library
            </h1>
            <p className="text-sm md:text-base text-slate-800 max-w-2xl" data-testid="research-library-description">
              Browse our collection of design ideas, customization tips, and creative inspiration for your personalized products.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        <ResearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={(value) => {
            setSelectedCategory(value);
            setPage(1);
          }}
          categories={categories}
          onClearFilters={resetFilters}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-4" data-testid="research-tag-cloud">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm font-semibold text-slate-900" data-testid="research-tag-cloud-title">Popular tags</p>
            {selectedTag && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTag('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                data-testid="research-clear-tag-button"
              >
                Clear tag filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" data-testid="research-tag-cloud-list">
            {tags.slice(0, 18).map((tagInfo) => (
              <button
                type="button"
                key={tagInfo.tag}
                onClick={() => {
                  setSelectedTag(tagInfo.tag === selectedTag ? '' : tagInfo.tag);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedTag === tagInfo.tag
                    ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
                data-testid={`research-tag-filter-${makeTagTestId(tagInfo.tag)}`}
              >
                {tagInfo.tag} ({tagInfo.count})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3" data-testid="research-results-meta">
          <p className="text-sm text-slate-800" data-testid="research-results-count">
            Showing <span className="font-semibold text-cyan-700">{articles.items.length}</span> of{' '}
            <span className="font-semibold text-cyan-700">{articles.total}</span> articles
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
            data-testid="research-library-shop-link"
          >
            <BookOpenText className="w-4 h-4" />
            Browse Products
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="research-error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="research-loading-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl bg-slate-100 border border-slate-200" />
            ))}
          </div>
        ) : hasResults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="research-articles-grid">
            {articles.items.map((article) => (
              <ResearchArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center" data-testid="research-empty-state">
            <h2 className="text-2xl font-heading font-semibold text-slate-800 mb-2" data-testid="research-empty-state-heading">
              No matching research found
            </h2>
            <p className="text-sm text-slate-800 mb-5" data-testid="research-empty-state-copy">
              Try another keyword, category, or tag to find relevant articles.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full bg-[#ff8c42] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e67a35] transition-colors"
              data-testid="research-empty-state-reset-button"
            >
              Reset Search
            </button>
          </div>
        )}

        {!loading && articles.total > articles.limit && (
          <div className="flex items-center justify-center gap-3" data-testid="research-pagination-controls">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              data-testid="research-pagination-prev-button"
            >
              Previous
            </button>
            <span className="text-sm text-slate-800" data-testid="research-pagination-label">Page {page}</span>
            <button
              type="button"
              disabled={!articles.has_more}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              data-testid="research-pagination-next-button"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
