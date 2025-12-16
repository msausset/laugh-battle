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

    console.log(`[VideoPlayer ${label}] useEffect appelé`, {
      hasVideoElement: !!videoElement,
      hasStream: !!stream,
      streamActive: stream?.active,
      videoTracks: stream?.getVideoTracks().length,
      audioTracks: stream?.getAudioTracks().length,
    });

    if (!videoElement || !stream) {
      console.log(`[VideoPlayer ${label}] Sortie précoce - pas de video ou stream`);
      return;
    }

    console.log(`[VideoPlayer ${label}] Assignation du srcObject`);
    videoElement.srcObject = stream;

    // Forcer la lecture de la vidéo
    videoElement.play()
      .then(() => {
        console.log(`[VideoPlayer ${label}] ✅ Lecture démarrée avec succès`);
      })
      .catch((error) => {
        console.error(`[VideoPlayer ${label}] ❌ Erreur lors de la lecture:`, error);
        // Réessayer après un court délai
        setTimeout(() => {
          videoElement.play()
            .then(() => console.log(`[VideoPlayer ${label}] ✅ Lecture démarrée (2ème essai)`))
            .catch(err => console.error(`[VideoPlayer ${label}] ❌ Échec 2ème essai:`, err));
        }, 100);
      });

    return () => {
      console.log(`[VideoPlayer ${label}] Cleanup`);
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, label]);

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border-2 border-gray-700">
      {isLoading || !stream ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">En attente de la vidéo...</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
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
