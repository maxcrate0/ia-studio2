import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        onKeySelected();
      } catch (error) {
        console.error("Erro ao abrir o seletor de chave de API:", error);
        alert("Ocorreu um erro ao tentar selecionar a chave de API.");
      }
    } else {
      console.error("A função window.aistudio.openSelectKey não está definida.");
      alert("A função para selecionar a chave de API não está disponível. Por favor, recarregue a página e tente novamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-white">Chave de API Necessária</h2>
        <p className="text-gray-400 mb-6">
          Esta ação requer uma chave de API do Gemini. Para alguns recursos como a geração de vídeo, o faturamento deve estar ativado. Selecione sua chave para continuar.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleSelectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Selecionar Chave de API
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline text-sm"
          >
            Saber mais sobre faturamento
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySelector;