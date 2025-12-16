import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';

interface UsePeerMatchmakingProps {
  onMatchFound?: () => void;
  onConnectionEstablished?: () => void;
}

export function usePeerMatchmaking({ onMatchFound, onConnectionEstablished }: UsePeerMatchmakingProps = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const hasReceivedCall = useRef(false);

  // Initialiser PeerJS
  useEffect(() => {
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('open', (id) => {
      console.log('🆔 Mon Peer ID:', id);
      setMyPeerId(id);
    });

    peer.on('error', (err) => {
      console.error('❌ Erreur PeerJS:', err);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, []);

  // Initialiser le stream local (caméra/micro)
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
        console.log('📹 Stream local initialisé');
      } catch (error) {
        console.error('❌ Impossible d\'accéder à la caméra/micro:', error);
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

  // Gérer les appels entrants
  useEffect(() => {
    const peer = peerRef.current;
    if (!peer || !localStream) return;

    const handleIncomingCall = (call: MediaConnection) => {
      // Éviter les appels multiples
      if (hasReceivedCall.current) {
        console.log('⚠️ Appel ignoré (déjà connecté)');
        return;
      }

      hasReceivedCall.current = true;
      console.log('📞 Appel entrant de:', call.peer);

      // Répondre à l'appel avec notre stream
      call.answer(localStream);

      call.on('stream', (remoteStream) => {
        console.log('📺 Stream distant reçu (appel entrant)');
        console.log('Tracks vidéo:', remoteStream.getVideoTracks().length);
        console.log('Tracks audio:', remoteStream.getAudioTracks().length);
        console.log('Stream actif:', remoteStream.active);
        setRemoteStream(remoteStream);
        setIsConnected(true);
        setIsSearching(false);
        if (onConnectionEstablished) onConnectionEstablished();
      });

      call.on('close', () => {
        console.log('📞 Appel terminé');
        setRemoteStream(null);
        setIsConnected(false);
        hasReceivedCall.current = false;
      });

      callRef.current = call;
      if (onMatchFound) onMatchFound();
    };

    peer.on('call', handleIncomingCall);

    return () => {
      peer.off('call', handleIncomingCall);
    };
  }, [localStream]);

  // Créer une room (devenir host)
  const createRoom = () => {
    if (!myPeerId) {
      console.error('❌ Peer ID pas encore initialisé');
      return;
    }

    // Générer un code de room simple (6 derniers caractères du peer ID)
    const code = myPeerId.slice(-6).toUpperCase();
    setRoomCode(code);
    setIsSearching(true);
    console.log('🎮 Room créée avec le code:', code);
    return code;
  };

  // Rejoindre une room avec un peer ID
  const joinRoom = (remotePeerId: string) => {
    if (!peerRef.current || !localStream) {
      console.error('❌ Peer ou stream local pas prêt');
      return;
    }

    console.log('🔗 Tentative de connexion à:', remotePeerId);
    setIsSearching(true);

    // Appeler le peer distant
    const call = peerRef.current.call(remotePeerId, localStream);

    call.on('stream', (remoteStream) => {
      console.log('📺 Stream distant reçu (appel sortant)');
      console.log('Tracks vidéo:', remoteStream.getVideoTracks().length);
      console.log('Tracks audio:', remoteStream.getAudioTracks().length);
      setRemoteStream(remoteStream);
      setIsConnected(true);
      setIsSearching(false);
      onConnectionEstablished?.();
    });

    call.on('close', () => {
      console.log('📞 Appel terminé');
      setRemoteStream(null);
      setIsConnected(false);
    });

    call.on('error', (err) => {
      console.error('❌ Erreur lors de l\'appel:', err);
      setIsSearching(false);
      alert('Impossible de se connecter à ce joueur. Vérifiez le code.');
    });

    callRef.current = call;
    onMatchFound?.();
  };

  // Quitter la partie
  const disconnect = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsSearching(false);
    setRoomCode(null);
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    myPeerId,
    roomCode,
    isSearching,
    createRoom,
    joinRoom,
    disconnect,
  };
}
