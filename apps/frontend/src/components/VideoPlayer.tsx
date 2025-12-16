import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  isMuted: boolean;
  isLoading?: boolean;
  mirror?: boolean;
}

export default function VideoPlayer({
  stream,
  label,
  isMuted,
  isLoading = false,
  mirror = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      console.log(`${label}: Assignation stream`);
      videoElement.srcObject = stream;
      videoElement.play().catch(err => console.error(`${label}: Erreur play`, err));
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, label]);

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border-2 border-gray-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
      />

      {(isLoading || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">En attente de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
        <span className="font-semibold">{label}</span>
      </div>

      {/* Muted indicator */}
      {isMuted && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
          <span className="text-sm">🔇 Muet</span>
        </div>
      )}
    </div>
  );
}
