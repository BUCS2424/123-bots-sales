import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

const RadioContext = createContext(null);

export const useRadio = () => useContext(RadioContext);

export const RadioProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentStation, setCurrentStation] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [buffering, setBuffering] = useState(false);
  const [callActive, setCallActive] = useState(false);
  // SiriusXM state — iframe mounted once user visits it
  const [sxmMounted, setSxmMounted] = useState(false);
  const [sxmActive, setSxmActive] = useState(false); // user chose SiriusXM tab
  const normalVolumeRef = useRef(0.8);

  // Wire up audio events once
  useEffect(() => {
    const audio = audioRef.current;
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onError = () => { setPlaying(false); setBuffering(false); };
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Volume ducking on calls
  useEffect(() => {
    const duck = () => {
      setCallActive(true);
      audioRef.current.volume = Math.min(normalVolumeRef.current * 0.1, 0.03);
    };
    const restore = () => {
      setCallActive(false);
      audioRef.current.volume = normalVolumeRef.current;
    };
    window.addEventListener("a2g_call_start", duck);
    window.addEventListener("a2g_call_end", restore);
    return () => {
      window.removeEventListener("a2g_call_start", duck);
      window.removeEventListener("a2g_call_end", restore);
    };
  }, []);

  const setVolume = useCallback((v) => {
    const vol = parseFloat(v);
    normalVolumeRef.current = vol;
    setVolumeState(vol);
    if (!callActive) audioRef.current.volume = vol;
  }, [callActive]);

  const playStation = useCallback(async (station, getStream) => {
    setBuffering(true);
    setPlaying(false);
    setCurrentStation(station);
    try {
      let streamUrl = station.url;
      if (station.id && (!streamUrl || streamUrl.includes("opml.radiotime"))) {
        const res = await apiClient.get(`/radio/tune?id=${station.id}`);
        streamUrl = res.data.best;
      }
      if (!streamUrl) { setBuffering(false); return false; }
      audioRef.current.pause();
      audioRef.current.src = streamUrl;
      audioRef.current.volume = callActive ? Math.min(normalVolumeRef.current * 0.1, 0.03) : normalVolumeRef.current;
      await audioRef.current.play();
      setPlaying(true);
      setBuffering(false);
      return true;
    } catch (e) {
      setBuffering(false);
      return false;
    }
  }, [callActive]);

  const togglePlay = useCallback(() => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [playing]);

  const stop = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.src = "";
    setCurrentStation(null);
    setPlaying(false);
  }, []);

  const mountSxm = useCallback(() => setSxmMounted(true), []);

  return (
    <RadioContext.Provider value={{
      audioRef, currentStation, playing, volume, buffering, callActive,
      setVolume, playStation, togglePlay, stop,
      sxmMounted, sxmActive, setSxmActive, mountSxm,
    }}>
      {children}
    </RadioContext.Provider>
  );
};
