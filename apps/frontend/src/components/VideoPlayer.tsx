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

  // Log à chaque render
  console.log(`[${label}] Render - stream:`, !!stream, 'isLoading:', isLoading);

  useEffect(() => {
    const videoElement = videoRef.current;
    console.log(`[${label}] useEffect - videoElement:`, !!videoElement, 'stream:', !!stream);

    if (!videoElement) return;

    if (stream) {
      // Éviter de réassigner le même stream (évite les re-renders inutiles)
      if (currentStreamId.current === stream.id) {
        console.log(`[${label}] ⏭️ Stream déjà assigné (même ID), skip`);
        return;
      }

      currentStreamId.current = stream.id;
      setLoadFailed(false); // Réinitialiser l'état d'échec
      console.log(`[${label}] ✅ Assignation stream au srcObject`);
      console.log(`[${label}] Stream details:`, {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      // Vérifier si les tracks vidéo sont mutés
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track, index) => {
        console.log(`[${label}] 📹 Track vidéo ${index}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label,
        });

        if (track.muted) {
          console.warn(`[${label}] ⚠️ ATTENTION: Track vidéo ${index} est MUTED - pas de données vidéo disponibles!`);

          // Écouter l'événement unmute pour détecter quand le track devient actif
          const handleUnmute = () => {
            console.log(`[${label}] 🎉 Track vidéo ${index} UNMUTED - données vidéo maintenant disponibles!`);
            videoElement.play().catch(e => console.error(`[${label}] ❌ Erreur play après unmute:`, e));
          };

          track.addEventListener('unmute', handleUnmute);
        }
      });

      // Ajouter des listeners pour diagnostiquer le chargement de la vidéo
      const handleLoadedMetadata = () => {
        console.log(`[${label}] 📊 Métadonnées chargées, dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        videoElement.play().catch(e => console.error(`[${label}] ❌ Erreur play après metadata:`, e));
      };

      let hasTriedReload = false;
      const handleLoadStart = () => {
        console.log(`[${label}] 🔄 Début du chargement de la vidéo`);

        // Si après 3 secondes les métadonnées ne sont pas chargées, marquer comme échec
        setTimeout(() => {
          if (videoElement.readyState === 0) {
            console.error(`[${label}] ⚠️ Timeout: Métadonnées non chargées après 3s - échec du chargement`);
            setLoadFailed(true);
          }
        }, 3000);
      };

      const handleLoadedData = () => {
        console.log(`[${label}] 📥 Premières données chargées`);
      };

      const handleCanPlay = () => {
        console.log(`[${label}] ▶️ Vidéo prête à être lue (canplay)`);
      };

      const handleStalled = () => {
        console.warn(`[${label}] ⏸️ Chargement bloqué (stalled)`);
      };

      const handleSuspend = () => {
        console.warn(`[${label}] ⏸️ Chargement suspendu (suspend)`);
      };

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('stalled', handleStalled);
      videoElement.addEventListener('suspend', handleSuspend);

      videoElement.srcObject = stream;

      // Vérifier que l'assignation a fonctionné
      console.log(`[${label}] srcObject assigné:`, !!videoElement.srcObject);

      // Important: Ne PAS utiliser load() avec MediaStream, cela peut causer des problèmes
      // Lancer directement la lecture
      const playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[${label}] ✅ Lecture démarrée`);
            console.log(`[${label}] Video state:`, {
              paused: videoElement.paused,
              readyState: videoElement.readyState,
              networkState: videoElement.networkState,
              videoWidth: videoElement.videoWidth,
              videoHeight: videoElement.videoHeight,
            });
          })
          .catch(err => {
            console.error(`[${label}] ❌ Erreur play:`, err);
            setLoadFailed(true);
          });
      }
    } else {
      console.log(`[${label}] ⚠️ Pas de stream à assigner`);
      videoElement.srcObject = null;
      currentStreamId.current = null;
    }

    return () => {
      console.log(`[${label}] Cleanup useEffect`);
      if (videoElement) {
        // Retirer tous les listeners pour éviter les fuites mémoire et les boucles
        const events = ['loadstart', 'loadeddata', 'loadedmetadata', 'canplay', 'stalled', 'suspend'];
        events.forEach(event => {
          videoElement.removeEventListener(event, () => {});
        });
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
