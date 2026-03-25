import React from 'react';
import { useLocation } from 'react-router-dom';
import { Pause, Play, Radio, X } from 'lucide-react';
import { useRadio } from '../../context/RadioContext';

export const AdminRadioMiniPlayer = () => {
  const location = useLocation();
  const radio = useRadio();

  const onRadioPage = location.pathname.startsWith('/admin/radio');
  const hasTrack = Boolean(radio.currentStation);

  return (
    <>
      {radio.sxmMounted && (
        <iframe
          src="https://player.siriusxm.com"
          title="SiriusXM Session Keeper"
          className="fixed w-px h-px -left-[200vw] -top-[200vh] opacity-0 pointer-events-none"
          data-testid="admin-radio-siriusxm-session-keeper"
        />
      )}

      {!onRadioPage && hasTrack && (
        <div
          className="fixed bottom-4 right-4 z-40 bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 shadow-xl min-w-[260px]"
          data-testid="admin-radio-mini-player"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" data-testid="admin-radio-mini-player-title">{radio.currentStation?.name || 'Radio'}</p>
              <p className="text-xs text-slate-400" data-testid="admin-radio-mini-player-state">
                {radio.buffering ? 'Buffering...' : radio.playing ? 'Live' : 'Paused'}
              </p>
            </div>
            <button onClick={radio.togglePlay} className="p-1.5 rounded hover:bg-slate-800" data-testid="admin-radio-mini-toggle-button">
              {radio.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={radio.stop} className="p-1.5 rounded hover:bg-slate-800" data-testid="admin-radio-mini-stop-button">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={radio.volume}
            onChange={(e) => radio.setVolume(e.target.value)}
            className="w-full mt-2 accent-blue-500"
            data-testid="admin-radio-mini-volume-slider"
          />
        </div>
      )}
    </>
  );
};
