interface GameEndScreenProps {
  result: 'win' | 'lose';
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function GameEndScreen({ result, onPlayAgain, onGoHome }: GameEndScreenProps) {
  const isWin = result === 'win';

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          {/* Result Icon */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div
              className={`absolute inset-0 ${
                isWin ? 'bg-green-500' : 'bg-red-500'
              } rounded-full animate-pulse opacity-25`}
            ></div>
            <div
              className={`relative flex items-center justify-center w-32 h-32 bg-gradient-to-br ${
                isWin
                  ? 'from-green-500 to-green-600'
                  : 'from-red-500 to-red-600'
              } rounded-full`}
            >
              <span className="text-6xl">{isWin ? '🏆' : '😂'}</span>
            </div>
          </div>

          {/* Result Text */}
          <h1 className="text-4xl font-bold mb-4">
            {isWin ? 'Victoire !' : 'Défaite !'}
          </h1>
          <p className="text-xl text-gray-300">
            {isWin
              ? 'Bravo ! Tu as réussi à garder ton sérieux !'
              : 'Tu as ri ! Ton adversaire gagne cette manche.'}
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="font-semibold mb-3">Résumé</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Résultat</span>
              <span className={isWin ? 'text-green-400' : 'text-red-400'}>
                {isWin ? 'Victoire' : 'Défaite'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            🔄 Rejouer
          </button>
          <button
            onClick={onGoHome}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition"
          >
            🏠 Accueil
          </button>
        </div>

        {/* Encouragement */}
        <p className="mt-6 text-sm text-gray-500">
          {isWin
            ? '🌟 Excellent ! Continue comme ça !'
            : '💪 Ne baisse pas les bras, réessaie !'}
        </p>
      </div>
    </main>
  );
}
