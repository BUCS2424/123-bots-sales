import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { setSeoMetadata } from '../../lib/seo';
import { useActivityMarketplaceGate, API } from './activityMarketplaceShared';
import axios from 'axios';

const ActivitiesDirectoryPage = () => {
  const ready = useActivityMarketplaceGate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSeoMetadata({ title: 'Activities | 123Bots', description: 'Browse tours, charters, and activities by category.' });
  }, []);

  useEffect(() => {
    if (!ready) return;
    axios.get(`${API}/api/public/tours-charters/categories`)
      .then((r) => setCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return <div className="min-h-screen bg-[#061a1f]"><Header /></div>;

  return (
    <div className="min-h-screen bg-[#061a1f]" data-testid="activities-directory-page">
      <Header />
      <section className="relative overflow-hidden pt-36 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300/80">Explore</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl lg:text-6xl">All Activities</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">Browse tours and charters by activity type. <Link to="/activities/companies" className="text-teal-300 underline hover:text-teal-200">Looking for a specific charter company?</Link></p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-400" /></div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-20 text-center text-slate-400" data-testid="activities-directory-empty">
            No activity categories yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/activities/category/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-teal-900/40 to-cyan-900/30" data-testid={`public-category-${c.slug}`}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20"><Compass className="h-10 w-10" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/25" />
                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-3">
                    <span className="bg-black/45 px-3 py-1.5 text-center text-xs font-black uppercase tracking-wide text-white sm:text-sm">{c.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default ActivitiesDirectoryPage;
