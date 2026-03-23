import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Microscope } from 'lucide-react';

const asTestId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const ResearchArticleCard = ({ article }) => {
  return (
    <article
      className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all"
      data-testid={`research-article-card-${asTestId(article.slug)}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
          data-testid={`research-article-category-${asTestId(article.slug)}`}
        >
          {article.category}
        </span>
        <Microscope className="w-4 h-4 text-slate-400" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-heading font-bold text-slate-800 mb-3" data-testid={`research-article-title-${asTestId(article.slug)}`}>
        {article.title}
      </h2>

      <p className="text-sm text-slate-800 leading-relaxed mb-5" data-testid={`research-article-summary-${asTestId(article.slug)}`}>
        {article.summary}
      </p>

      <div className="mb-6 flex flex-wrap gap-2" data-testid={`research-article-tags-${asTestId(article.slug)}`}>
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
            {tag}
          </span>
        ))}
      </div>

      <Link
        to={`/research/${article.slug}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
        data-testid={`research-article-open-link-${asTestId(article.slug)}`}
      >
        Read article
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </article>
  );
};
