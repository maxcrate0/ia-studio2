import React, { useRef } from 'react';
import { Paperclip, Send, Image as ImageIcon, X, Sparkles } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  onImprovePrompt: () => void;
  isImproving: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, onSubmit, isLoading, onFileChange, selectedFile, onImprovePrompt, isImproving }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
    event.target.value = ''; // Reset file input
  };
  
  const handleRemoveFile = () => {
    onFileChange(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        onSubmit();
      }
    }
  };

  const adjustTextAreaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    adjustTextAreaHeight();
  }, [prompt]);

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4 w-full">
      <div className="max-w-4xl mx-auto">
        {selectedFile && (
          <div className="mb-2 bg-gray-700 p-2 rounded-lg flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gray-400" />
              <span className="truncate">{selectedFile.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-1 hover:bg-gray-600 rounded-full" disabled={isLoading}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="relative flex items-end bg-gray-700 rounded-xl p-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button
            onClick={handleFileButtonClick}
            className="p-2 text-gray-400 hover:text-white transition-colors self-end"
            disabled={isLoading}
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <textarea
            ref={textAreaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite seu prompt ou anexe uma imagem..."
            className="w-full bg-transparent resize-none focus:outline-none text-white placeholder-gray-400 max-h-48 overflow-y-auto px-2"
            rows={1}
            disabled={isLoading || isImproving}
          />
          <button
            onClick={onImprovePrompt}
            disabled={isLoading || isImproving || !prompt.trim()}
            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors self-end disabled:text-gray-600 disabled:cursor-not-allowed"
            title="Melhorar prompt"
          >
            {isImproving ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-6 h-6" />}
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || isImproving || (!prompt.trim() && !selectedFile)}
            className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors self-end"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
