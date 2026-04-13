import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_PATH = '/models';
const SMILE_THRESHOLD = 0.75;
const DETECTION_INTERVAL_MS = 200;
const SUSTAINED_SMILE_MS = 800;
const NO_FACE_TIMEOUT_MS = 3000;
// Points 48–67 : bouche externe + interne (modèle 68 landmarks)
const MOUTH_LANDMARK_INDICES = Array.from({ length: 20 }, (_, i) => i + 48);

/**
 * Calcule un score de visibilité de la bouche (0–100) basé sur la variance
 * des pixels de la zone landmark. Purement informatif (mode entraînement).
 * Pas utilisé comme signal de pénalité car trop sensible aux faux positifs
 * (bouche fermée, lèvres claires, faible éclairage).
 */
function computeMouthVisibilityScore(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  positions: faceapi.Point[]
): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || video.videoWidth === 0) return 100;

  const mouthPts = MOUTH_LANDMARK_INDICES.map((i) => positions[i]);
  const xs = mouthPts.map((p) => p.x);
  const ys = mouthPts.map((p) => p.y);

  const pad = 16;
  const x = Math.max(0, Math.min(...xs) - pad);
  const y = Math.max(0, Math.min(...ys) - pad);
  const w = Math.min(video.videoWidth - x, Math.max(...xs) - Math.min(...xs) + pad * 2);
  const h = Math.min(video.videoHeight - y, Math.max(...ys) - Math.min(...ys) + pad * 2);

  if (w <= 4 || h <= 4) return 100;

  canvas.width = Math.round(w * 0.5);
  canvas.height = Math.round(h * 0.5);
  ctx.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const n = data.length / 4;
  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += gray;
    sumSq += gray * gray;
  }

  const mean = sum / n;
  const stdDev = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  // Normaliser sur 0–100 (stdDev ~0 → 0, stdDev ~50+ → 100)
  return Math.min(100, Math.round((stdDev / 40) * 100));
}

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
  // mouthDetected reflète uniquement la détection de visage (fiable)
  // mouthVisibilityScore est informatif uniquement (entraînement)
  const [mouthDetected, setMouthDetected] = useState(true);
  const [mouthVisibilityScore, setMouthVisibilityScore] = useState(100);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smilingStartRef = useRef<number | null>(null);
  const noFaceStartRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);
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

  // Créer les éléments cachés pour la détection
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    return () => {
      video.srcObject = null;
      videoRef.current = null;
      canvasRef.current = null;
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
      setSmileConfidence(0);
      setFaceDetected(true);
      setMouthDetected(true);
      setMouthVisibilityScore(100);
    }
  }, [enabled]);

  // Boucle de détection via setTimeout récursif (évite l'accumulation de tâches)
  useEffect(() => {
    if (!isModelLoaded || !enabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const detect = async () => {
      if (cancelled || hasTriggeredRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState < 2) {
        if (!cancelled) timeoutId = setTimeout(detect, DETECTION_INTERVAL_MS);
        return;
      }

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (cancelled || hasTriggeredRef.current) return;

        if (!result) {
          // Aucun visage détecté → timer de pénalité
          setFaceDetected(false);
          setMouthDetected(false);
          setMouthVisibilityScore(0);
          smilingStartRef.current = null;
          setSmileConfidence(0);

          if (noFaceStartRef.current === null) {
            noFaceStartRef.current = Date.now();
          } else if (Date.now() - noFaceStartRef.current >= NO_FACE_TIMEOUT_MS) {
            hasTriggeredRef.current = true;
            onNoFaceRef.current?.();
            return;
          }
        } else {
          // Visage détecté → réinitialiser timer no-face
          setFaceDetected(true);
          setMouthDetected(true);
          noFaceStartRef.current = null;

          // Score de visibilité bouche (informatif, entraînement uniquement)
          if (canvas) {
            const score = computeMouthVisibilityScore(video, canvas, result.landmarks.positions);
            setMouthVisibilityScore(score);
          }

          // Détection du sourire
          const happy = result.expressions.happy ?? 0;
          setSmileConfidence(Math.round(happy * 100));

          if (happy >= SMILE_THRESHOLD) {
            if (smilingStartRef.current === null) {
              smilingStartRef.current = Date.now();
            } else if (Date.now() - smilingStartRef.current >= SUSTAINED_SMILE_MS) {
              hasTriggeredRef.current = true;
              onLaughRef.current();
              return;
            }
          } else {
            smilingStartRef.current = null;
          }
        }
      } catch {
        // Ignorer les erreurs de détection individuelles
      }

      if (!cancelled && !hasTriggeredRef.current) {
        timeoutId = setTimeout(detect, DETECTION_INTERVAL_MS);
      }
    };

    detect();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isModelLoaded, enabled]);

  return { isModelLoaded, smileConfidence, faceDetected, mouthDetected, mouthVisibilityScore };
}
