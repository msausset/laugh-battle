import { useEffect, useRef, useState } from 'react';

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
  const currentStreamId = useRef<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [volume, setVolume] = useState(1);

  // Synchroniser le volume sur l'élément vidéo
  useEffect(() => {
    if (videoRef.current && !isMuted) {
      videoRef.current.volume = volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const videoElement = videoRef.current;
    console.log(`[${label}] useEffect - videoElement:`, !!videoElement, 'stream:', !!stream);

    if (!videoElement) return;

    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const isSameStream = currentStreamId.current === stream.id;

      if (isSameStream && videoTrack && !videoTrack.muted) {
        console.log(`[${label}] ⏭️ Stream déjà assigné (même ID, track non muted), skip`);
        return;
      }

      if (videoTrack && videoTrack.muted) {
        console.log(`[${label}] ⚠️ Stream avec track MUTED, on assigne quand même en attendant unmute`);
      }

      currentStreamId.current = stream.id;
      setLoadFailed(false);
      console.log(`[${label}] ✅ Assignation stream au srcObject`);

      const videoTracks = stream.getVideoTracks();
      const unmuteHandlers: Array<{ track: MediaStreamTrack; handler: () => void }> = [];

      videoTracks.forEach((track, index) => {
        const handleUnmute = () => {
          console.log(`[${label}] 🎉 Track vidéo ${index} UNMUTED - réassignation du stream`);
          videoElement.srcObject = null;
          setTimeout(() => {
            videoElement.srcObject = stream;
            videoElement.play()
              .then(() => setLoadFailed(false))
              .catch(e => console.error(`[${label}] ❌ Erreur play après unmute:`, e));
          }, 100);
        };

        track.addEventListener('unmute', handleUnmute);
        unmuteHandlers.push({ track, handler: handleUnmute });
      });

      let loadTimeoutId: NodeJS.Timeout | null = null;
      let hasLoadStarted = false;

      const handleLoadedMetadata = () => {
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        videoElement.play().catch(e => console.error(`[${label}] ❌ Erreur play après metadata:`, e));
      };

      const handleLoadStart = () => {
        if (hasLoadStarted) return;
        hasLoadStarted = true;
        loadTimeoutId = setTimeout(() => {
          if (videoElement.readyState === 0) setLoadFailed(true);
        }, 3000);
      };

      const handleLoadedData = () => { if (loadTimeoutId) clearTimeout(loadTimeoutId); };
      const handleCanPlay = () => { if (loadTimeoutId) clearTimeout(loadTimeoutId); };
      const handleStalled = () => console.warn(`[${label}] ⏸️ Chargement bloqué`);
      const handleSuspend = () => console.warn(`[${label}] ⏸️ Chargement suspendu`);

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('stalled', handleStalled);
      videoElement.addEventListener('suspend', handleSuspend);

      videoElement.srcObject = stream;

      videoElement.play()
        .then(() => console.log(`[${label}] ✅ Lecture démarrée`))
        .catch(err => {
          console.error(`[${label}] ❌ Erreur play:`, err);
          setLoadFailed(true);
        });

      return () => {
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        unmuteHandlers.forEach(({ track, handler }) => track.removeEventListener('unmute', handler));
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('stalled', handleStalled);
        videoElement.removeEventListener('suspend', handleSuspend);
      };
    } else {
      videoElement.srcObject = null;
      currentStreamId.current = null;
    }
  }, [stream, label]);

  const volumeIcon = volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border-2 border-gray-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
      />

      {loadFailed && stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
          <div className="text-center p-4">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400 font-semibold mb-2">Impossible de charger la vidéo</p>
            <p className="text-gray-400 text-sm">
              Problème de compatibilité WebRTC.
              <br />
              Essayez avec 2 navigateurs identiques.
            </p>
          </div>
        </div>
      )}

      {(isLoading || !stream) && !loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">En attente de la vidéo...</p>
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
        <span className="font-semibold text-sm">{label}</span>
      </div>

      {/* Contrôle du volume (flux adversaire uniquement) */}
      {!isMuted && stream && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none select-none">{volumeIcon}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 cursor-pointer accent-primary-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
