import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

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
      })
      .catch(() => { if (active) navigate('/'); });
    return () => { active = false; };
  }, [navigate]);

  return ready;
};

export { API };
