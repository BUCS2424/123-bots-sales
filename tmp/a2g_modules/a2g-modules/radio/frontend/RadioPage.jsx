import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "../App";
import { useRadio } from "../context/RadioContext";
import { Input } from "../components/ui/input";
import {
  Radio, Search, Play, Pause, Music, Newspaper,
  Trophy, MessageSquare, Mic, Loader2, Phone, Heart,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "popular", label: "Trending",  icon: <Radio className="w-3.5 h-3.5" /> },
  { id: "music",   label: "Pop/Top40", icon: <Music className="w-3.5 h-3.5" /> },
  { id: "country", label: "Country",   icon: <Music className="w-3.5 h-3.5" /> },
  { id: "rock",    label: "Rock",      icon: <Music className="w-3.5 h-3.5" /> },
  { id: "hiphop",  label: "Hip-Hop",   icon: <Music className="w-3.5 h-3.5" /> },
  { id: "jazz",    label: "Jazz",      icon: <Music className="w-3.5 h-3.5" /> },
  { id: "80s",     label: "80s",       icon: <Music className="w-3.5 h-3.5" /> },
  { id: "news",    label: "News",      icon: <Newspaper className="w-3.5 h-3.5" /> },
  { id: "sports",  label: "Sports",    icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: "talk",    label: "Talk",      icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "local",   label: "Local",     icon: <Mic className="w-3.5 h-3.5" /> },
  { id: "favorites", label: "Favorites", icon: <Heart className="w-3.5 h-3.5 fill-current" /> },
];

const FAVS_KEY = "a2g_radio_favorites";

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
}
function saveFavs(favs) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
}

// ── TuneIn Player ─────────────────────────────────────────────────────────────
const TuneInPlayer = () => {
  const radio = useRadio();
  const [category, setCategory] = useState("popular");
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState(loadFavs);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (category === "favorites") {
      setStations(loadFavs());
    } else {
      loadFeatured(category);
    }
  }, [category]);

  const loadFeatured = async (cat) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/radio/featured?category=${cat}`);
      setStations(res.data);
    } catch { toast.error("Failed to load stations"); }
    finally { setLoading(false); }
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { loadFeatured(category === "favorites" ? "popular" : category); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get(`/radio/search?q=${encodeURIComponent(q)}`);
        setStations(res.data);
      } catch { toast.error("Search failed"); }
      finally { setSearching(false); }
    }, 500);
  };

  const isFav = (station) => favorites.some(f => f.id === station.id);

  const toggleFav = (e, station) => {
    e.stopPropagation();
    const current = loadFavs();
    let updated;
    if (isFav(station)) {
      updated = current.filter(f => f.id !== station.id);
      toast.success(`Removed ${station.name} from favorites`);
    } else {
      updated = [...current, station];
      toast.success(`Added ${station.name} to favorites`);
    }
    saveFavs(updated);
    setFavorites(updated);
    // If on favorites tab, refresh the list
    if (category === "favorites") setStations(updated);
  };

  const handlePlay = async (station) => {
    if (radio.currentStation?.id === station.id && radio.playing) {
      radio.togglePlay(); return;
    }
    radio.setSxmActive(false);
    const ok = await radio.playStation(station);
    if (!ok) toast.error("Stream failed — try another station");
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-blue-900/40 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">TuneIn Radio</h2>
            <p className="text-xs text-slate-400">100,000+ live stations worldwide</p>
          </div>
          {radio.callActive && (
            <div className="ml-auto flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
              <Phone className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400 font-medium">Volume ducked</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchQuery} onChange={e => handleSearch(e.target.value)}
            placeholder="Search stations, genres, cities..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {/* Category Pills */}
      {!searchQuery && (
        <div className="flex gap-2 px-6 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => {
            const isFavsTab = cat.id === "favorites";
            const favCount = favorites.length;
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? isFavsTab ? "bg-rose-500 text-white" : "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}>
                {cat.icon}
                {cat.label}
                {isFavsTab && favCount > 0 && (
                  <span className={`ml-0.5 text-xs rounded-full px-1.5 py-0 ${category === "favorites" ? "bg-white/20" : "bg-slate-700"}`}>
                    {favCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Station Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : category === "favorites" && stations.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No favorites yet</p>
            <p className="text-sm mt-1">Tap the ♥ on any station to save it here</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No stations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {stations.map((station, i) => {
              const isActive = radio.currentStation?.id === station.id;
              const fav = isFav(station);
              return (
                <button key={station.id || i} onClick={() => handlePlay(station)}
                  className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive ? "bg-blue-600 ring-2 ring-blue-400" : "bg-slate-800 hover:bg-slate-700"
                  }`}>
                  {station.logo
                    ? <img src={station.logo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-700" />
                    : <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center shrink-0">
                        <Radio className="w-5 h-5 text-slate-400" />
                      </div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate pr-5">{station.name}</p>
                    {station.subtext && <p className="text-xs text-slate-400 truncate">{station.subtext}</p>}
                    {station.current_track && <p className="text-xs text-blue-300 truncate">♪ {station.current_track}</p>}
                  </div>

                  {/* Heart button */}
                  <button
                    onClick={(e) => toggleFav(e, station)}
                    className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                      fav ? "text-rose-400 hover:text-rose-300" : "text-slate-600 hover:text-rose-400"
                    }`}
                    data-testid={`fav-btn-${station.id || i}`}>
                    <Heart className={`w-3.5 h-3.5 ${fav ? "fill-current" : ""}`} />
                  </button>

                  {/* Playing indicator */}
                  {isActive && !radio.buffering && radio.playing && (
                    <div className="absolute bottom-2 right-2 flex gap-0.5">
                      {[0,1,2].map(n => (
                        <span key={n} className="w-0.5 h-3 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: `${n * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                  {isActive && radio.buffering && (
                    <div className="absolute bottom-2 right-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      {radio.currentStation && (
        <div className="absolute bottom-0 left-3 right-3 mb-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
          {radio.currentStation.logo
            ? <img src={radio.currentStation.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
            : <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center"><Radio className="w-5 h-5 text-white" /></div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{radio.currentStation.name}</p>
            <p className="text-xs text-slate-400">{radio.buffering ? "Buffering..." : radio.playing ? "● Live" : "Paused"}</p>
          </div>
          <button onClick={(e) => toggleFav(e, radio.currentStation)}
            className={`p-1.5 rounded-full transition-colors ${isFav(radio.currentStation) ? "text-rose-400" : "text-slate-500 hover:text-rose-400"}`}>
            <Heart className={`w-4 h-4 ${isFav(radio.currentStation) ? "fill-current" : ""}`} />
          </button>
          <input type="range" min="0" max="1" step="0.05" value={radio.volume}
            onChange={e => radio.setVolume(e.target.value)}
            className="w-20 accent-blue-500" />
          <button onClick={radio.togglePlay} disabled={radio.buffering}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors">
            {radio.buffering
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : radio.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
};

// ── SiriusXM Player ──────────────────────────────────────────────────────────
const SiriusXMPlayer = () => {
  const radio = useRadio();

  // Mount the persistent iframe and mark SiriusXM as active
  useEffect(() => {
    radio.mountSxm();
    radio.setSxmActive(true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden relative">
      {/* Header bar — sits above the iframe which is injected by DashboardLayout */}
      <div className="flex items-center justify-between px-5 py-3 bg-black border-b border-slate-800 shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">SiriusXM</span>
            <p className="text-xs text-slate-400">Login once — stays signed in when you navigate away</p>
          </div>
        </div>
        {radio.callActive && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
            <Phone className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-xs text-amber-400 font-medium">Call active — pause music</span>
          </div>
        )}
      </div>
      {/* The actual iframe is rendered in DashboardLayout and positioned over this area */}
      <div className="flex-1 bg-black" />
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RadioPage = () => {
  const radio = useRadio();
  const [activeTab, setActiveTab] = useState(() => radio?.sxmActive ? "siriusxm" : "tunein");

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "tunein") {
      radio.setSxmActive(false);
    }
    // sxmActive is set inside SiriusXMPlayer on mount
  };

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col" data-testid="radio-page">
      {/* Toggle */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-500" />
          <span className="text-white font-bold text-base">Radio</span>
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button onClick={() => switchTab("tunein")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "tunein" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:text-white"
            }`}
            data-testid="tab-tunein">
            TuneIn
          </button>
          <button onClick={() => switchTab("siriusxm")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "siriusxm" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:text-white"
            }`}
            data-testid="tab-siriusxm">
            SiriusXM
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-950 p-3">
        {activeTab === "tunein" && <TuneInPlayer />}
        {activeTab === "siriusxm" && <SiriusXMPlayer />}
      </div>
    </div>
  );
};

export default RadioPage;
