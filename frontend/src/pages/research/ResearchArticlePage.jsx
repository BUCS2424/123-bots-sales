import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { fetchResearchArticle, fetchResearchArticles } from './researchApi';
import { setSeoMetadata } from '../../lib/seo';

const makeSlugTestId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makeProductSlug = (productName) => {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function ResearchArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError('');

        const articleData = await fetchResearchArticle(slug);
        setArticle(articleData);

        const relatedResponse = await fetchResearchArticles({
          category: articleData.category,
          page: 1,
          limit: 4,
        });

        const related = relatedResponse.items.filter((item) => item.slug !== articleData.slug).slice(0, 3);
        setRelatedArticles(related);
      } catch (apiError) {
        setError(apiError.response?.data?.detail || 'Unable to load this research article.');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  useEffect(() => {
    if (!article) return;

    setSeoMetadata({
      title: article.meta_title || `${article.title} | GingerKare`,
      description: article.meta_description || article.summary,
      keywords: article.meta_keywords || article.tags.join(', '),
      canonicalPath: `/research/${article.slug}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.summary,
        articleSection: article.category,
        about: article.tags,
        inLanguage: 'en',
        author: {
          '@type': 'Organization',
          name: 'GingerKare Custom Emporium',
        },
      },
    });
  }, [article]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-32 px-6 lg:px-8" data-testid="research-article-loading-state">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-80 w-full bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-32 px-6 lg:px-8" data-testid="research-article-error-state">
        <div className="max-w-2xl mx-auto rounded-3xl border border-red-200 bg-white p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-semibold text-slate-800 mb-2" data-testid="research-article-error-heading">
            Article unavailable
          </h1>
          <p className="text-sm text-slate-800 mb-6" data-testid="research-article-error-copy">
            {error || 'This article could not be found.'}
          </p>
          <Link
            to="/research"
            className="inline-flex items-center gap-2 rounded-full bg-[#ff8c42] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e67a35]"
            data-testid="research-article-error-back-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-32" data-testid="research-article-page">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <Link
          to="/research"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800 mb-6"
          data-testid="research-article-back-link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to articles
        </Link>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 mb-8" data-testid={`research-article-header-${makeSlugTestId(article.slug)}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 mb-3" data-testid="research-article-category-label">
            {article.category}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-slate-800 mb-4" data-testid="research-article-title">
            {article.title}
          </h1>
          <p className="text-base md:text-lg text-slate-800 mb-5" data-testid="research-article-summary">
            {article.summary}
          </p>

          <div className="flex flex-wrap gap-2" data-testid="research-article-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 mb-8" data-testid="research-article-content-section">
          <div
            className="research-prose max-w-none text-slate-900"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="research-article-content"
          />
        </section>

        {article.related_products?.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 mb-8" data-testid="research-related-products">
            <h2 className="text-2xl font-heading font-semibold text-slate-800 mb-4" data-testid="research-related-products-heading">
              Related products
            </h2>
            <div className="flex flex-wrap gap-2" data-testid="research-related-products-list">
              {article.related_products.map((product) => {
                // related_products stores objects with name, slug, category_slug
                const productSlug = typeof product === 'object' ? product.slug : makeProductSlug(product);
                const categorySlug = typeof product === 'object' ? product.category_slug : 'peptides';
                const productName = typeof product === 'object' ? product.name : product;
                
                return (
                  <Link
                    key={productSlug}
                    to={`/shop/${categorySlug}/${productSlug}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 transition-colors"
                  >
                    {productName}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {relatedArticles.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 mb-8" data-testid="research-related-articles">
            <h2 className="text-2xl font-heading font-semibold text-slate-800 mb-5" data-testid="research-related-articles-heading">
              Continue reading
            </h2>
            <div className="grid md:grid-cols-3 gap-4" data-testid="research-related-articles-grid">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  to={`/research/${item.slug}`}
                  className="rounded-2xl border border-slate-200 p-4 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
                  data-testid={`research-related-article-link-${makeSlugTestId(item.slug)}`}
                >
                  <p className="text-xs font-semibold text-cyan-700 mb-2">{item.category}</p>
                  <h3 className="font-heading font-semibold text-slate-800 text-base">{item.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-[#ff8c42]/30 bg-[#fff8f0] p-6 md:p-8" data-testid="research-compliance-note">
          <p className="text-sm text-[#a55a2a] mb-4" data-testid="research-compliance-note-text">
            Looking for custom products? Browse our shop or contact us for personalized designs!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/research"
              className="inline-flex items-center gap-2 rounded-full border border-[#ff8c42] px-5 py-2 text-sm font-semibold text-[#a55a2a] hover:bg-[#ff8c42]/10"
              data-testid="research-compliance-library-button"
            >
              Browse more articles
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff8c42] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e67a35]"
              data-testid="research-compliance-shop-button"
            >
              Explore products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
