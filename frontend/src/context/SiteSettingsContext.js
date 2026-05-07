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