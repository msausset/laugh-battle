import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';

interface UsePeerMatchmakingProps {
  onMatchFound?: () => void;
  onConnectionEstablished?: () => void;
}

export type MediaPermissionStatus = 'pending' | 'granted' | 'denied';

export function usePeerMatchmaking({ onMatchFound, onConnectionEstablished }: UsePeerMatchmakingProps = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [mediaPermissionStatus, setMediaPermissionStatus] = useState<MediaPermissionStatus>('pending');

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

        // S'assurer que tous les tracks sont activés et non mutés
        stream.getTracks().forEach((track) => {
          track.enabled = true;
          console.log(`Track ${track.kind}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });
        });

        setLocalStream(stream);
        setMediaPermissionStatus('granted');
        console.log('📹 Stream local initialisé');
      } catch (error) {
        console.error('❌ Impossible d\'accéder à la caméra/micro:', error);
        setMediaPermissionStatus('denied');
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
      console.log('📞 Appel entrant de:', call.peer);

      // Répondre à l'appel avec notre stream
      call.answer(localStream);

      let streamReceived = false;
      call.on('stream', (remoteStream) => {
        // Ignorer les événements stream multiples
        if (streamReceived) {
          console.log('⚠️ Stream supplémentaire ignoré');
          return;
        }
        streamReceived = true;

        console.log('📺 Stream distant reçu (appel entrant)');
        console.log('Tracks vidéo:', remoteStream.getVideoTracks().length);
        console.log('Tracks audio:', remoteStream.getAudioTracks().length);
        console.log('Stream actif:', remoteStream.active);

        // Vérifier l'état des tracks vidéo
        remoteStream.getVideoTracks().forEach((track, index) => {
          console.log(`Track vidéo ${index} (AVANT):`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id,
          });

          // S'assurer que le track est enabled
          track.enabled = true;

          console.log(`Track vidéo ${index} (APRÈS):`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });

          // Écouter l'événement unmute pour voir si le track devient actif plus tard
          if (track.muted) {
            console.warn(`⚠️ Track vidéo ${index} est MUTED - pas de données disponibles actuellement`);

            const handleUnmute = () => {
              console.log(`🎉 Track vidéo ${index} est devenu UNMUTED! Création d'un nouveau MediaStream...`, {
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
              });

              // Créer un nouveau MediaStream avec les mêmes tracks pour forcer React à détecter le changement
              const newStream = new MediaStream(remoteStream.getTracks());
              console.log('📺 Nouveau stream créé avec ID:', newStream.id);
              setRemoteStream(newStream);
            };

            track.addEventListener('unmute', handleUnmute, { once: true });
          }
        });

        setRemoteStream(remoteStream);
        setIsConnected(true);
        setIsSearching(false);
        if (onConnectionEstablished) onConnectionEstablished();
      });

      call.on('close', () => {
        console.log('📞 Appel terminé');
        setRemoteStream(null);
        setIsConnected(false);
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

    let streamReceived = false;
    call.on('stream', (remoteStream) => {
      // Ignorer les événements stream multiples
      if (streamReceived) {
        console.log('⚠️ Stream supplémentaire ignoré');
        return;
      }
      streamReceived = true;

      console.log('📺 Stream distant reçu (appel sortant)');
      console.log('Tracks vidéo:', remoteStream.getVideoTracks().length);
      console.log('Tracks audio:', remoteStream.getAudioTracks().length);

      // Vérifier l'état des tracks vidéo
      remoteStream.getVideoTracks().forEach((track, index) => {
        console.log(`Track vidéo ${index} (AVANT):`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          id: track.id,
        });

        // S'assurer que le track est enabled
        track.enabled = true;

        console.log(`Track vidéo ${index} (APRÈS):`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });

        // Écouter l'événement unmute pour voir si le track devient actif plus tard
        if (track.muted) {
          console.warn(`⚠️ Track vidéo ${index} est MUTED - pas de données disponibles actuellement`);

          const handleUnmute = () => {
            console.log(`🎉 Track vidéo ${index} est devenu UNMUTED! Création d'un nouveau MediaStream...`, {
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
            });

            // Créer un nouveau MediaStream avec les mêmes tracks pour forcer React à détecter le changement
            const newStream = new MediaStream(remoteStream.getTracks());
            console.log('📺 Nouveau stream créé avec ID:', newStream.id);
            setRemoteStream(newStream);
          };

          track.addEventListener('unmute', handleUnmute, { once: true });
        }
      });

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
    mediaPermissionStatus,
    createRoom,
    joinRoom,
    disconnect,
  };
}
