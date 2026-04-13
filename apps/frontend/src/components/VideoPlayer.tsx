import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  isMuted: boolean;
  isLoading?: boolean;
  mirror?: boolean;
}

// Slider de volume façon YouTube
function VolumeSlider({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getVolume = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return volume;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(getVolume(e.clientX));
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) onChange(getVolume(e.clientX));
  };
  const handlePointerUp = () => { isDragging.current = false; };

  const pct = volume * 100;
  const icon = volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';

  return (
    <div className="flex items-center gap-2 group/vol">
      {/* Bouton icône : clic → toggle mute */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onChange(volume === 0 ? 0.8 : 0)}
        className="text-base leading-none select-none text-white/80 hover:text-white transition flex-shrink-0"
      >
        {icon}
      </button>

      {/* Piste */}
      <div
        ref={trackRef}
        className="relative flex-1 h-4 flex items-center cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Track background — s'épaissit au hover */}
        <div className="absolute w-full rounded-full bg-white/30 h-[3px] group-hover/vol:h-[5px] transition-all duration-150">
          {/* Partie remplie */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Thumb (cercle blanc, visible au hover) */}
        <div
          className="absolute w-[13px] h-[13px] bg-white rounded-full shadow-md opacity-0 group-hover/vol:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{ left: `calc(${pct}% - 6.5px)` }}
        />
      </div>
    </div>
  );
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
    if (!videoElement) return;

    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const isSameStream = currentStreamId.current === stream.id;

      if (isSameStream && videoTrack && !videoTrack.muted) return;

      currentStreamId.current = stream.id;
      setLoadFailed(false);

      const unmuteHandlers: Array<{ track: MediaStreamTrack; handler: () => void }> = [];
      stream.getVideoTracks().forEach((track, index) => {
        const handleUnmute = () => {
          console.log(`[${label}] Track vidéo ${index} UNMUTED — réassignation`);
          videoElement.srcObject = null;
          setTimeout(() => {
            videoElement.srcObject = stream;
            videoElement.play()
              .then(() => setLoadFailed(false))
              .catch(e => console.error(`[${label}] Erreur play après unmute:`, e));
          }, 100);
        };
        track.addEventListener('unmute', handleUnmute);
        unmuteHandlers.push({ track, handler: handleUnmute });
      });

      let loadTimeoutId: NodeJS.Timeout | null = null;
      let hasLoadStarted = false;

      const handleLoadedMetadata = () => {
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        videoElement.play().catch(e => console.error(`[${label}] Erreur play:`, e));
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

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);

      videoElement.srcObject = stream;
      videoElement.play()
        .catch(err => { console.error(`[${label}] Erreur play:`, err); setLoadFailed(true); });

      return () => {
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        unmuteHandlers.forEach(({ track, handler }) => track.removeEventListener('unmute', handler));
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    } else {
      videoElement.srcObject = null;
      currentStreamId.current = null;
    }
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

      {/* Volume (adversaire uniquement, flux actif) */}
      {!isMuted && stream && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <VolumeSlider volume={volume} onChange={setVolume} />
        </div>
      )}
    </div>
  );
}
