'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, MoreVertical } from 'lucide-react';

type AudioBubbleProps = {
  src: string;
  onDelete?: () => void;
};

const formatAudioTime = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export default function AudioBubble({ src, onDelete }: AudioBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [audioUrl, setAudioUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setMenuOpen(false);
    setAudioUrl('');

    if (!src) return;

    const cargarAudio = async () => {
      try {
        const res = await fetch(src);

        if (!res.ok) {
          throw new Error(`Error descargando audio: ${res.status}`);
        }

        const blobOriginal = await res.blob();

        const blob = new Blob([blobOriginal], {
          type: 'audio/webm'
        });

        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setAudioUrl(objectUrl);
        }
      } catch (error) {
        console.error('Error preparando audio:', {
          src,
          error
        });
      }
    };

    cargarAudio();

    return () => {
      cancelled = true;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !audioUrl) return;

    try {
      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
    }
  };

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative w-[285px] max-w-full rounded-2xl border border-cyan-300/40 bg-gradient-to-br from-cyan-50 to-white px-3 py-2 shadow-[0_0_18px_rgba(34,211,238,.16)]">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          console.error('Error cargando audio local:', {
            src,
            audioUrl,
            error: e.currentTarget.error
          });
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setMenuOpen(prev => !prev)}
        className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 rounded-full text-cyan-900/70 hover:bg-cyan-100 flex items-center justify-center z-10"
        title="Opciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {menuOpen && onDelete && (
        <div className="absolute top-8 right-2 z-20 w-36 rounded-xl border border-cyan-200 bg-white shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
          >
            Eliminar audio
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 pr-6">
        <div className="w-8 h-8 shrink-0 rounded-full bg-[#03111A] border border-cyan-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(34,211,238,.22)]">
          <img
            src="/m-icon.png"
            alt="Martina"
            className="w-5 h-5 object-contain"
          />
        </div>

        <button
          type="button"
          onClick={togglePlay}
          disabled={!audioUrl}
          className="w-5 h-6 shrink-0 text-black flex items-center justify-center disabled:opacity-40"
          title={playing ? 'Pausar audio' : 'Reproducir audio'}
        >
          {playing ? (
            <Pause className="w-5 h-5 fill-black" />
          ) : (
            <Play className="w-5 h-5 fill-black" />
          )}
        </button>

        <div className="relative flex-1 min-w-0 ml-[2px] h-10">
          <div className="absolute left-[7px] right-0 top-[18px] h-[1.5px] rounded-full bg-[#7CCFDC]">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#0E8FA0]"
              style={{ width: `${progress}%` }}
            />

            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0E8FA0] shadow-[0_0_4px_rgba(14,143,160,.18)]"
              style={{ left: `calc(${progress}% - 4px)` }}
            />
          </div>

          <div className="absolute left-[7px] right-0 top-[29px] flex items-center justify-between text-[10px] leading-none text-[#0E8FA0]">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
