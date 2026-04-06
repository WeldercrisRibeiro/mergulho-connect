import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  isUpload?: boolean;
  className?: string;
  poster?: string;
}

const VideoPlayer = ({ url, isUpload, className, poster }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to detect and convert YouTube/Vimeo URLs
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
    }
    if (url.includes("vimeo.com")) {
      const regExp = /vimeo\.com\/([0-9]+)/;
      const match = url.match(regExp);
      return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : null;
    }
    return null;
  };

  const embedUrl = !isUpload ? getEmbedUrl(url) : null;

  if (!url) return null;

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl group", className)}>
      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setIsPlaying(true)}>
          {poster && <img src={poster} alt="Video Poster" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
          <div className="z-10 h-20 w-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Play className="h-8 w-8 fill-white ml-1" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {isUpload ? (
            <video 
              src={url} 
              className="w-full h-full" 
              controls 
              autoPlay 
              onLoadedData={() => setIsLoading(false)}
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white p-4 text-center text-sm">
              Formato de vídeo não suportado ou link inválido.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
