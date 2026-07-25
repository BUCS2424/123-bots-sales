import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}`;

const FAREHARBOR_SCRIPT_ID = 'fareharbor-lightframe-script';

// FareHarbor's official Lightframe script - must fire on every public page of this
// component so any fareharbor-embed link/booking element on the page works correctly.
const injectFareHarborScript = () => {
  if (document.getElementById(FAREHARBOR_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = FAREHARBOR_SCRIPT_ID;
  script.type = 'text/javascript';
  script.src = 'https://fareharbor.com/embeds/api/v1/?autolightframe=yes';
  script.async = true;
  document.body.appendChild(script);
};

// Shared gate: redirects home if the Activity & Charter Marketplace feature flag is off.
// Mirrors the events module pattern so toggling the flag OFF hides every route here too.
export const useActivityMarketplaceGate = () => {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    axios.get(`${API}/api/settings/feature-flags`)
      .then((r) => {
        if (!active) return;
        if (!r.data?.activity_marketplace_enabled) { navigate('/'); return; }
        setReady(true);
        injectFareHarborScript();
      })
      .catch(() => { if (active) navigate('/'); });
    return () => { active = false; };
  }, [navigate]);

  return ready;
};

export { API };
