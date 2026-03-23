import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LegacyProductRedirectPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const resolveLegacyUrl = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/store/products/${productId}`);
        const seoUrl = response.data?.seo_url;
        if (seoUrl) {
          navigate(`/shop/${seoUrl}`, { replace: true });
          return;
        }
      } catch (error) {
        // fallthrough to catalog
      }

      navigate('/shop', { replace: true });
    };

    resolveLegacyUrl();
  }, [navigate, productId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="legacy-product-redirect-page">
      <div className="text-sm text-slate-500">Redirecting to updated product URL…</div>
    </div>
  );
};

export default LegacyProductRedirectPage;