import React, { useState } from 'react';

interface ApiKeyInputModalProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInputModal: React.FC<ApiKeyInputModalProps> = ({ onKeySubmit }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onKeySubmit(inputValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">Informe sua Chave de API do Gemini</h2>
        <p className="text-gray-400 mb-6">
          Para usar este aplicativo, você precisa de uma chave de API do Google AI Studio. Cole sua chave abaixo para começar.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Cole sua chave de API aqui"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Salvar e Continuar
          </button>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline text-sm"
          >
            Obtenha uma chave de API
          </a>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyInputModal;
