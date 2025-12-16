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

  // Log à chaque render
  console.log(`[${label}] Render - stream:`, !!stream, 'isLoading:', isLoading);

  useEffect(() => {
    const videoElement = videoRef.current;
    console.log(`[${label}] useEffect - videoElement:`, !!videoElement, 'stream:', !!stream);

    if (!videoElement) return;

    if (stream) {
      console.log(`[${label}] ✅ Assignation stream au srcObject`);
      videoElement.srcObject = stream;

      // Vérifier que l'assignation a fonctionné
      console.log(`[${label}] srcObject assigné:`, !!videoElement.srcObject);

      videoElement.play()
        .then(() => console.log(`[${label}] ✅ Lecture démarrée`))
        .catch(err => console.error(`[${label}] ❌ Erreur play:`, err));
    } else {
      console.log(`[${label}] ⚠️ Pas de stream à assigner`);
    }

    return () => {
      console.log(`[${label}] Cleanup useEffect`);
      if (videoElement && videoElement.srcObject) {
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
