import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_PATH = '/models';
const SMILE_THRESHOLD = 0.75;
const DETECTION_INTERVAL_MS = 400;
const SUSTAINED_SMILE_MS = 1500;
// Pas de visage détecté pendant 3s → défaite
const NO_FACE_TIMEOUT_MS = 3000;
// Pas de bouche détectée pendant 5s → défaite
const NO_MOUTH_TIMEOUT_MS = 5000;
// Indices des landmarks de la bouche (modèle 68 points : 48–67)
const MOUTH_LANDMARK_INDICES = Array.from({ length: 20 }, (_, i) => i + 48);

export function useFaceDetection({
  stream,
  onLaughDetected,
  onNoFaceDetected,
  enabled = true,
}: {
  stream: MediaStream | null;
  onLaughDetected: () => void;
  onNoFaceDetected?: () => void;
  enabled?: boolean;
}) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [smileConfidence, setSmileConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [mouthDetected, setMouthDetected] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const smilingStartRef = useRef<number | null>(null);
  const noFaceStartRef = useRef<number | null>(null);
  const noMouthStartRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onLaughRef = useRef(onLaughDetected);
  const onNoFaceRef = useRef(onNoFaceDetected);

  useEffect(() => {
    onLaughRef.current = onLaughDetected;
    onNoFaceRef.current = onNoFaceDetected;
  }, [onLaughDetected, onNoFaceDetected]);

  // Charger les modèles une seule fois
  useEffect(() => {
    faceapi.nets.tinyFaceDetector
      .loadFromUri(MODELS_PATH)
      .then(() => faceapi.nets.faceExpressionNet.loadFromUri(MODELS_PATH))
      .then(() => faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_PATH))
      .then(() => setIsModelLoaded(true))
      .catch((err) => console.error('Erreur chargement modèles face-api:', err));
  }, []);

  // Créer un élément vidéo caché pour alimenter face-api sans toucher au VideoPlayer
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;
    return () => {
      video.srcObject = null;
    };
  }, []);

  // Brancher le stream sur la vidéo cachée
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Réinitialiser quand la détection est réactivée (nouvelle partie)
  useEffect(() => {
    if (enabled) {
      hasTriggeredRef.current = false;
      smilingStartRef.current = null;
      noFaceStartRef.current = null;
      noMouthStartRef.current = null;
      setSmileConfidence(0);
      setFaceDetected(true);
      setMouthDetected(true);
    }
  }, [enabled]);

  // Lancer la détection quand modèles + stream + enabled
  useEffect(() => {
    if (!isModelLoaded || !enabled || hasTriggeredRef.current) return;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (!result) {
          // Pas de visage détecté
          setFaceDetected(false);
          setMouthDetected(false);
          smilingStartRef.current = null;
          noMouthStartRef.current = null;
          setSmileConfidence(0);

          if (noFaceStartRef.current === null) {
            noFaceStartRef.current = Date.now();
          } else if (Date.now() - noFaceStartRef.current >= NO_FACE_TIMEOUT_MS) {
            hasTriggeredRef.current = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            onNoFaceRef.current?.();
          }
          return;
        }

        // Visage détecté — réinitialiser le timer no-face
        setFaceDetected(true);
        noFaceStartRef.current = null;

        // Vérifier si la bouche est visible via les landmarks
        const landmarks = result.landmarks.positions;
        const videoWidth = video.videoWidth || 1;
        const videoHeight = video.videoHeight || 1;
        const mouthPoints = MOUTH_LANDMARK_INDICES.map((i) => landmarks[i]);
        const isMouthVisible = mouthPoints.every(
          (pt) => pt.x > 0 && pt.y > 0 && pt.x < videoWidth && pt.y < videoHeight
        );

        if (!isMouthVisible) {
          setMouthDetected(false);
          smilingStartRef.current = null;
          setSmileConfidence(0);

          if (noMouthStartRef.current === null) {
            noMouthStartRef.current = Date.now();
          } else if (Date.now() - noMouthStartRef.current >= NO_MOUTH_TIMEOUT_MS) {
            hasTriggeredRef.current = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            onNoFaceRef.current?.();
          }
          return;
        }

        // Bouche visible — réinitialiser le timer no-mouth
        setMouthDetected(true);
        noMouthStartRef.current = null;

        const happy = result.expressions.happy ?? 0;
        setSmileConfidence(Math.round(happy * 100));

        if (happy >= SMILE_THRESHOLD) {
          if (smilingStartRef.current === null) {
            smilingStartRef.current = Date.now();
          } else if (Date.now() - smilingStartRef.current >= SUSTAINED_SMILE_MS) {
            hasTriggeredRef.current = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            onLaughRef.current();
          }
        } else {
          smilingStartRef.current = null;
        }
      } catch {
        // Ignorer les erreurs de détection individuelles
      }
    };

    intervalRef.current = setInterval(detect, DETECTION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isModelLoaded, enabled]);

  return { isModelLoaded, smileConfidence, faceDetected, mouthDetected };
}
