import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { buildSiteSettingsState } from '../lib/siteDefaults';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SiteSettingsContext = createContext(buildSiteSettingsState({}, true));

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => buildSiteSettingsState({}, true));

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings/site`);
        const fetchedSettings = response.data;
        
        // Build full URLs for relative paths
        if (fetchedSettings.logo_url && fetchedSettings.logo_url.startsWith('/')) {
          fetchedSettings.logo_url = `${API_URL}${fetchedSettings.logo_url}`;
        }
        if (fetchedSettings.pwa_icon_url && fetchedSettings.pwa_icon_url.startsWith('/')) {
          fetchedSettings.pwa_icon_url = `${API_URL}${fetchedSettings.pwa_icon_url}`;
        }

        const nextSettings = buildSiteSettingsState(fetchedSettings, false);

        if (nextSettings.siteName) {
          document.title = nextSettings.siteName;
        }

        if (nextSettings.faviconUrl) {
          // Build the full URL if it's a relative path
          let faviconFullUrl = nextSettings.faviconUrl;
          if (faviconFullUrl.startsWith('/')) {
            faviconFullUrl = `${API_URL}${faviconFullUrl}`;
          }
          
          // Update ALL favicon-related link elements
          const faviconSelectors = [
            "link[rel='icon']",
            "link[rel='shortcut icon']",
            "link[rel='apple-touch-icon']"
          ];
          
          faviconSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              el.href = faviconFullUrl;
            });
          });
          
          // If no icon exists, create one
          if (!document.querySelector("link[rel='icon']")) {
            const iconLink = document.createElement('link');
            iconLink.type = 'image/x-icon';
            iconLink.rel = 'icon';
            iconLink.href = faviconFullUrl;
            document.head.appendChild(iconLink);
          }
        }

        if (nextSettings.pwaIconUrl) {
          let pwaIconFullUrl = nextSettings.pwaIconUrl;
          if (pwaIconFullUrl.startsWith('/')) {
            pwaIconFullUrl = `${API_URL}${pwaIconFullUrl}`;
          }

          // Rebuild the manifest with the configured icon so "Add to Home
          // Screen" picks it up - the static manifest.json is only a
          // pre-JS fallback and can't be edited from here directly.
          const manifest = {
            short_name: nextSettings.siteName,
            name: nextSettings.siteName,
            icons: [
              { src: pwaIconFullUrl, sizes: '192x192', type: 'image/png' },
              { src: pwaIconFullUrl, sizes: '512x512', type: 'image/png' },
            ],
            start_url: '/',
            display: 'standalone',
            theme_color: '#050f17',
            background_color: '#050f17',
          };
          const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          const manifestUrl = URL.createObjectURL(manifestBlob);

          let manifestLink = document.querySelector("link[rel='manifest']");
          if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            document.head.appendChild(manifestLink);
          }
          manifestLink.href = manifestUrl;
        }

        window.__DEBUG_MODE__ = nextSettings.debugMode;
        if (nextSettings.debugMode) {
          console.log('[DEBUG MODE] Site settings loaded:', response.data);
        }

        setSettings(nextSettings);
      } catch (error) {
        console.error('Error fetching site settings:', error);
        window.__DEBUG_MODE__ = false;
        setSettings(buildSiteSettingsState({}, false));
      }
    };

    fetchSiteSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
};