import { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useSiteFeatureFlags = () => {
  const [flags, setFlags] = useState({
    _loaded: false,
    cart_enabled: true,
    quotes_enabled: true,
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
    coming_soon_enabled: false,
    coming_soon_password: '8487',
    external_api_enabled: true,
    inventory_enabled: false,
    events_enabled: false,
    events_landing_enabled: false,
    events_center_name: 'Event Center',
    activity_marketplace_enabled: false,
    service_crm_enabled: false,
    service_crm_product_name: 'Robot',
  });

  useEffect(() => {
    let active = true;

    const fetchFlags = async () => {
      try {
        // Fetch both in parallel so a slow/failing site-settings request never
        // blocks (or gates) the feature flags that control the coming-soon gate.
        const [siteRes, ffRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/settings/site`),
          fetch(`${API_URL}/api/settings/feature-flags`),
        ]);

        let siteData = {};
        let featureData = {};
        if (siteRes.status === 'fulfilled' && siteRes.value.ok) {
          siteData = await siteRes.value.json();
        }
        if (ffRes.status === 'fulfilled' && ffRes.value.ok) {
          featureData = await ffRes.value.json();
        }

        if (!active) return;

        setFlags({
          _loaded: true,
          cart_enabled: featureData.cart_enabled !== false,
          quotes_enabled: featureData.quotes_enabled !== false,
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
          coming_soon_enabled: featureData.coming_soon_enabled === true,
          coming_soon_password: featureData.coming_soon_password || '8487',
          external_api_enabled: featureData.external_api_enabled !== false,
          inventory_enabled: Boolean(featureData.inventory_enabled),
          events_enabled: Boolean(featureData.events_enabled),
          events_landing_enabled: Boolean(featureData.events_landing_enabled),
          events_center_name: featureData.events_center_name || 'Event Center',
          activity_marketplace_enabled: Boolean(featureData.activity_marketplace_enabled),
          service_crm_enabled: Boolean(featureData.service_crm_enabled),
          service_crm_product_name: featureData.service_crm_product_name || 'Robot',
        });
      } catch (error) {
        // On error, fail OPEN (never lock the site behind the gate) but mark loaded.
        if (active) {
          setFlags((prev) => ({ ...prev, _loaded: true, coming_soon_enabled: false }));
        }
      }
    };

    fetchFlags();

    return () => {
      active = false;
    };
  }, []);

  return flags;
};
