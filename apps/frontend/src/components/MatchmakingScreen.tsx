interface MatchmakingScreenProps {
  isConnected: boolean;
  onCancel: () => void;
}

export default function MatchmakingScreen({ isConnected, onCancel }: MatchmakingScreenProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
              <span className="text-5xl">🔍</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">
            Recherche d'un adversaire...
          </h1>

          <div className="space-y-2 text-gray-400">
            {!isConnected ? (
              <p className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚪</span>
                Connexion au serveur...
              </p>
            ) : (
              <>
                <p className="flex items-center justify-center gap-2">
                  <span className="text-green-400">✓</span>
                  Connecté au serveur
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">🟡</span>
                  En attente d'un joueur...
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="font-semibold mb-3">Pendant que tu attends...</h2>
          <ul className="space-y-2 text-sm text-gray-400 text-left">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Assure-toi que ta caméra et ton micro fonctionnent</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Prépare tes meilleures grimaces</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Garde ton sérieux, c'est important !</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          Annuler
        </button>
      </div>
    </main>
  );
}
