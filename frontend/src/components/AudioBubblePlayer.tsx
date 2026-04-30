import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

export function AudioBubblePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * a.duration;
  };

  const heights = [6, 10, 14, 8, 16, 12, 18, 10, 6, 14, 18, 10, 8, 16, 12, 6, 14, 10, 18, 8, 12, 16, 6, 10, 14, 8, 18, 12];

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 min-w-[220px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
      />
      <button
        type="button"
        onClick={toggle}
        className="h-10 w-10 shrink-0 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:bg-[#1DA851] transition-colors"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 h-[18px]" onClick={handleSeek} style={{ cursor: "pointer" }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 2.5,
                height: heights[i % heights.length],
                backgroundColor: ((i / 28) * 100) <= progress ? "#25D366" : "#B0B0B0",
                opacity: ((i / 28) * 100) <= progress ? 1 : 0.45
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#666] font-medium leading-none">
          {playing || currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  );
}
