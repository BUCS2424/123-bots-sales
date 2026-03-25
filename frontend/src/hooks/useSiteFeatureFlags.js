import { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useSiteFeatureFlags = () => {
  const [flags, setFlags] = useState({
    cart_enabled: true,
    pawn_checkout: true,
    storage_online: false,
    storage_pos: false,
    ai_products: true,
    notifications: false,
    sms: false,
    analytics: true,
    require_account_for_checkout: false,
    require_email_verification_for_registration: true,
    left_menu_enabled: true,
    coming_soon_enabled: true,
    coming_soon_password: '8487',
  });

  useEffect(() => {
    let active = true;

    const fetchFlags = async () => {
      try {
        // Fetch site settings
        const response = await fetch(`${API_URL}/api/settings/site`);
        let siteData = {};
        if (response.ok) {
          siteData = await response.json();
        }

        // Fetch public feature flags
        const featureFlagsRes = await fetch(`${API_URL}/api/settings/feature-flags`);
        let featureData = {};
        if (featureFlagsRes.ok) {
          featureData = await featureFlagsRes.json();
        }

        if (!active) return;

        setFlags({
          cart_enabled: featureData.cart_enabled !== false,
          pawn_checkout: featureData.pawn_checkout !== false,
          storage_online: Boolean(featureData.storage_online),
          storage_pos: Boolean(featureData.storage_pos),
          ai_products: featureData.ai_products !== false,
          notifications: Boolean(featureData.notifications),
          sms: Boolean(featureData.sms),
          analytics: featureData.analytics !== false,
          require_account_for_checkout: Boolean(siteData.require_account_for_checkout),
          require_email_verification_for_registration:
            siteData.require_email_verification_for_registration !== false,
          left_menu_enabled: featureData.left_menu_enabled !== false,
          coming_soon_enabled: featureData.coming_soon_enabled !== false,
          coming_soon_password: featureData.coming_soon_password || '8487',
        });
      } catch (error) {
        // Keep safe defaults
      }
    };

    fetchFlags();

    return () => {
      active = false;
    };
  }, []);

  return flags;
};
