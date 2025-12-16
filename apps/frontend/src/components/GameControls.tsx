interface GameControlsProps {
  onILaughed: () => void;
}

export default function GameControls({ onILaughed }: GameControlsProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2">🎯 Objectif</h2>
          <p className="text-gray-300">
            Fais rire ton adversaire sans rire toi-même !
          </p>
        </div>

        <button
          onClick={onILaughed}
          className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-xl font-bold text-xl transition-all transform hover:scale-105"
        >
          😂 J'ai ri !
          <span className="block text-xs mt-1 opacity-75">
            Clique si tu as ri
          </span>
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 <strong>Conseil :</strong> Sois créatif ! Fais des grimaces, raconte des blagues, ou
          essaie d'imiter quelqu'un. Le premier qui rit perd !
        </p>
      </div>
    </div>
  );
}
