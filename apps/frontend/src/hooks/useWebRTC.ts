import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

interface UseWebRTCProps {
  socket: Socket | null;
  gameId: string | null;
  isInitiator: boolean;
  onStreamReceived?: (stream: MediaStream) => void;
}

export function useWebRTC({ socket, gameId, isInitiator, onStreamReceived }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerRef = useRef<SimplePeer.Instance | null>(null);

  // Initialize local media stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        setLocalStream(stream);
        console.log('📹 Local stream initialized');
      } catch (error) {
        console.error('Failed to get local stream:', error);
        alert('Impossible d\'accéder à la caméra/micro. Vérifiez les permissions.');
      }
    };

    initLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!socket || !localStream || !gameId) return;

    console.log(`🔗 Initializing WebRTC (initiator: ${isInitiator})`);

    const peer = new SimplePeer({
      initiator: isInitiator,
      stream: localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data) => {
      console.log('📡 Sending signal:', data.type);

      if (data.type === 'offer') {
        socket.emit(SocketEvents.OFFER, { offer: data, gameId });
      } else if (data.type === 'answer') {
        socket.emit(SocketEvents.ANSWER, { answer: data, gameId });
      }
    });

    peer.on('stream', (stream) => {
      console.log('📺 Remote stream received');
      setRemoteStream(stream);
      setIsConnected(true);
      onStreamReceived?.(stream);
    });

    peer.on('connect', () => {
      console.log('✅ Peer connection established');
      setIsConnected(true);
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
      setIsConnected(false);
    });

    // Handle incoming signals
    socket.on(SocketEvents.OFFER, ({ offer }) => {
      console.log('📡 Received offer');
      peer.signal(offer);
    });

    socket.on(SocketEvents.ANSWER, ({ answer }) => {
      console.log('📡 Received answer');
      peer.signal(answer);
    });

    socket.on(SocketEvents.ICE_CANDIDATE, ({ candidate }) => {
      console.log('🧊 Received ICE candidate');
      peer.signal(candidate);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      socket.off(SocketEvents.OFFER);
      socket.off(SocketEvents.ANSWER);
      socket.off(SocketEvents.ICE_CANDIDATE);
    };
  }, [socket, localStream, gameId, isInitiator]);

  return {
    localStream,
    remoteStream,
    isConnected,
    peer: peerRef.current,
  };
}
