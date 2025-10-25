import React from 'react';
import { ResultItem, Feature } from '../types';
import { Bot, Image, Video, Volume2, Search, Edit3, Pencil } from 'lucide-react';

interface ResultDisplayProps {
  result: ResultItem;
  onEditImageRequest: (imageUrl: string) => void;
}


const FeatureTag: React.FC<{ feature: Feature }> = ({ feature }) => {
  const featureMap = {
    [Feature.Chat]: { icon: <Bot className="w-4 h-4" />, text: 'Chat', color: 'bg-blue-500/20 text-blue-300' },
    [Feature.Search]: { icon: <Search className="w-4 h-4" />, text: 'Pesquisa', color: 'bg-green-500/20 text-green-300' },
    [Feature.ImageGeneration]: { icon: <Image className="w-4 h-4" />, text: 'Geração de Imagem', color: 'bg-purple-500/20 text-purple-300' },
    [Feature.ImageEditing]: { icon: <Edit3 className="w-4 h-4" />, text: 'Edição de Imagem', color: 'bg-pink-500/20 text-pink-300' },
    [Feature.VideoGeneration]: { icon: <Video className="w-4 h-4" />, text: 'Geração de Vídeo', color: 'bg-red-500/20 text-red-300' },
    [Feature.TTS]: { icon: <Volume2 className="w-4 h-4" />, text: 'Audio', color: 'bg-yellow-500/20 text-yellow-300' },
  };
  
  const { icon, text, color } = featureMap[feature] || { icon: null, text: 'Unknown', color: 'bg-gray-500/20 text-gray-300' };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onEditImageRequest }) => {
  const renderContent = () => {
    switch (result.type) {
      case 'text':
        return <div className="whitespace-pre-wrap text-gray-300">{result.data}</div>;
      case 'image':
        return (
          <div className="relative group">
            <img src={result.data} alt="Generated" className="rounded-lg max-w-full h-auto max-h-[70vh]" />
            <button 
              onClick={() => onEditImageRequest(result.data)}
              className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          </div>
        );
      case 'video':
        return <video src={result.data} controls className="rounded-lg max-w-full max-h-[70vh]" />;
      case 'audio':
        return <audio src={result.data} controls className="w-full" />;
      case 'sources':
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Fontes:</h4>
            <ul className="space-y-1">
              {(result.data as {uri: string; title: string}[]).map((source, index) => (
                <li key={index}>
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm truncate block">
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'error':
        return <div className="text-red-400 bg-red-500/10 p-3 rounded-lg">{result.data}</div>;
      default:
        return null;
    }
  };

  if (!result.feature) return null; // Should not render user prompts

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 md:p-6 w-full mb-4 flex gap-4">
      <Bot className="w-8 h-8 text-indigo-400 flex-shrink-0 mt-1" />
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
           <FeatureTag feature={result.feature} />
        </div>
        <div className="prose prose-invert max-w-none">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
