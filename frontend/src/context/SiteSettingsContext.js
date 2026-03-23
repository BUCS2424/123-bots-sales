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
        const nextSettings = buildSiteSettingsState(response.data, false);

        if (nextSettings.siteName) {
          document.title = nextSettings.siteName;
        }

        if (nextSettings.faviconUrl) {
          const existingIcon = document.querySelector("link[rel='icon']") || document.querySelector("link[rel='shortcut icon']");
          const iconLink = existingIcon || document.createElement('link');
          iconLink.type = 'image/x-icon';
          iconLink.rel = 'icon';
          iconLink.href = nextSettings.faviconUrl;
          if (!existingIcon) {
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