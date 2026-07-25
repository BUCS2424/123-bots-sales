import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { setSeoMetadata } from '../../lib/seo';
import { useActivityMarketplaceGate, API } from './activityMarketplaceShared';
import axios from 'axios';

// Renders the activities within a single category OR a single charter company,
// depending on which slug param is present. Same "table"/grid look either way.
const ActivityListPage = ({ mode }) => {
  const ready = useActivityMarketplaceGate();
  const { slug } = useParams();
  const [activities, setActivities] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSeoMetadata({ title: 'Activities | 123Bots', description: 'Browse activities and book with the charter company directly.' });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const param = mode === 'company' ? { seller_slug: slug } : { category_slug: slug };
    const entityEndpoint = mode === 'company' ? 'sellers' : 'categories';
    Promise.all([
      axios.get(`${API}/api/public/tours-charters/activities`, { params: param }),
      axios.get(`${API}/api/public/tours-charters/${entityEndpoint}`),
    ]).then(([actRes, entRes]) => {
      setActivities(actRes.data || []);
      const match = (entRes.data || []).find((e) => e.slug === slug);
      setEntityName(match?.name || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready, slug, mode]);

  if (!ready) return <div className="min-h-screen bg-[#061a1f]"><Header /></div>;

  const backHref = mode === 'company' ? '/activities/companies' : '/activities';
  const backLabel = mode === 'company' ? 'All Charter Companies' : 'All Activities';

  return (
    <div className="min-h-screen bg-[#061a1f]" data-testid="activity-list-page">
      <Header />
      <section className="relative overflow-hidden pt-36 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Link to={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200" data-testid="activity-list-back-link">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <h1 className="text-3xl font-black text-white sm:text-4xl">{entityName || 'Activities'}</h1>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-400" /></div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-20 text-center text-slate-400" data-testid="activity-list-empty">
            No activities here yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link to={`/activities/view/${a.alias}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f24] transition hover:border-teal-500/50" data-testid={`public-activity-${a.alias}`}>
                  <div className="relative h-44 bg-gradient-to-br from-teal-900/40 to-cyan-900/30">
                    {a.images?.[0] ? <img src={a.images[0]} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-white/20"><Sparkles className="h-12 w-12" /></div>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white">{a.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><Building2 className="h-3.5 w-3.5" /> {a.seller_name}</p>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                      <span>{a.price_display || 'Price TBD'}</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 transition group-hover:gap-2.5">View <ArrowRight className="h-4 w-4" /></span>
                    </div>
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

export default ActivityListPage;
