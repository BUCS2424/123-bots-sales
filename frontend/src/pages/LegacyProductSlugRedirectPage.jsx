import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LegacyProductSlugRedirectPage = () => {
  const { legacySlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const resolveLegacySlug = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/store/products/legacy-seo/${legacySlug}`);
        const seoUrl = response.data?.seo_url;
        if (seoUrl) {
          navigate(`/shop/${seoUrl}`, { replace: true });
          return;
        }
      } catch (error) {
        // fallback below
      }

      navigate('/shop', { replace: true });
    };

    resolveLegacySlug();
  }, [legacySlug, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="legacy-product-slug-redirect-page">
      <div className="text-sm text-slate-500">Redirecting to updated product URL…</div>
    </div>
  );
};

export default LegacyProductSlugRedirectPage;