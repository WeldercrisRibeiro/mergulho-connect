import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PhotoCarousel = ({ photos, className }: { photos: any[], className?: string }) => {
  const [idx, setIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!photos || photos.length === 0) return;
    const timer = setInterval(() => {
      setIdx((current) => (current + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) next();
    if (distance < -minSwipeDistance) prev();
  };

  if (!photos || photos.length === 0) return null;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-black/5 border border-white/10 shadow-2xl group ${className || "h-[300px] md:h-[500px]"}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          key={photos[idx]?.id}
          src={photos[idx]?.url}
          alt={photos[idx]?.caption || ""}
          className="w-full h-full object-cover animate-fade-in transition-all duration-700"
        />
      </div>

      {photos[idx]?.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 text-white">
          <p className="text-lg font-medium drop-shadow-md">{photos[idx].caption}</p>
        </div>
      )}

      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
