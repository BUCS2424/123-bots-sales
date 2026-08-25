import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { buildSiteSettingsState } from '../lib/siteDefaults';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const toAbsoluteUrl = (path) => {
  if (!path) return path;
  try {
    return new URL(path, window.location.origin).href;
  } catch (e) {
    return path;
  }
};

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
        if (fetchedSettings.logo_url) {
          fetchedSettings.logo_url = toAbsoluteUrl(fetchedSettings.logo_url);
        }
        if (fetchedSettings.pwa_icon_url) {
          fetchedSettings.pwa_icon_url = toAbsoluteUrl(fetchedSettings.pwa_icon_url);
        }

        const nextSettings = buildSiteSettingsState(fetchedSettings, false);

        if (nextSettings.siteName) {
          document.title = nextSettings.siteName;
        }

        if (nextSettings.faviconUrl) {
          const faviconFullUrl = toAbsoluteUrl(nextSettings.faviconUrl);

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