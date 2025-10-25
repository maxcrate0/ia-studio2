import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResultItem, Task, Feature, ChatSession } from './types';
import PromptInput from './components/PromptInput';
import ResultDisplay from './components/ResultDisplay';
import LoadingIndicator from './components/LoadingIndicator';
import ApiKeySelector from './components/ApiKeySelector';
import ChatHistory from './components/ChatHistory';
import UserPromptDisplay from './components/UserPromptDisplay';
import { dispatchPrompt, executeTask, improvePrompt, generateChatTitle } from './services/geminiService';
import { Bot } from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [needsApiKey, setNeedsApiKey] = useState<boolean>(false);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);

  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect runs once on mount to check for an existing API key.
    const checkApiKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeyReady(hasKey);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
        setApiKeyReady(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    try {
        const savedSessions = localStorage.getItem('chatSessions');
        if (savedSessions) {
            setSessions(JSON.parse(savedSessions));
        }
    } catch (e) {
        console.error("Failed to load sessions from localStorage", e);
        setSessions([]);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
    } catch (e) {
        console.error("Failed to save sessions to localStorage", e);
    }
  }, [sessions]);
  
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    } else if (!currentSessionId && sessions.length === 0) {
      handleNewChat();
    }
  }, [sessions, currentSessionId]);

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  const updateCurrentConversation = (newItem: ResultItem | ((prev: ResultItem[]) => ResultItem[])) => {
    setSessions(prevSessions => {
        return prevSessions.map(session => {
            if (session.id === currentSessionId) {
                const newConversation = typeof newItem === 'function'
                    ? newItem(session.conversation)
                    : [...session.conversation, newItem];
                return { ...session, conversation: newConversation };
            }
            return session;
        });
    });
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Novo Chat',
      conversation: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };
  
  const handleDeleteChat = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
    }
  };

  const handleApiKeySelected = () => {
    setApiKeyReady(true);
    setNeedsApiKey(false);
    handleSubmit();
  };
  
  const handleImprovePrompt = async () => {
    if (!prompt.trim() || isImproving) return;
    setIsImproving(true);
    try {
      const improved = await improvePrompt(prompt);
      setPrompt(improved);
    } catch (e) {
      console.error("Failed to improve prompt", e);
      // Optionally show an error to the user
    } finally {
      setIsImproving(false);
    }
  };
  
  const handleEditImageRequest = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "edit-image.png", { type: blob.type });
      setSelectedFile(file);
      document.querySelector('textarea')?.focus();
    } catch (error) {
      console.error("Error fetching image for editing:", error);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!apiKeyReady) {
      setNeedsApiKey(true);
      return;
    }

    const trimmedPrompt = prompt.trim();
    if ((!trimmedPrompt && !selectedFile) || isLoading) return;

    setIsLoading(true);
    setLoadingMessage('Analisando seu pedido...');
    setError(null);
    
    let currentId = currentSessionId;
    if (!currentId) {
      const newSessionId = Date.now().toString();
      setSessions(prev => [{ id: newSessionId, title: "Novo Chat", conversation: [] }, ...prev]);
      setCurrentSessionId(newSessionId);
      currentId = newSessionId;
    }

    let userImageBase64: string | null = null;
    if (selectedFile) {
        userImageBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.readAsDataURL(selectedFile);
        });
    }

    updateCurrentConversation({
        id: Date.now().toString(),
        type: 'user',
        data: trimmedPrompt,
        userImage: userImageBase64,
    });
    
    // Auto-generate title for the first message
    const currentSession = sessions.find(s => s.id === currentId);
    if (currentSession && currentSession.conversation.length === 1 && trimmedPrompt) {
        generateChatTitle(trimmedPrompt).then(title => {
            setSessions(prev => prev.map(s => s.id === currentId ? { ...s, title } : s));
        });
    }

    try {
      const tasks = await dispatchPrompt(trimmedPrompt, selectedFile);
      
      let lastResult: any = null;
      for (const task of tasks) {
        setLoadingMessage(getLoadingMessageForTask(task));
        const { type, data, sources } = await executeTask(task, { previousResult: lastResult, imageFile: selectedFile });
        
        const newResult: ResultItem = {
            id: Date.now().toString() + Math.random(),
            type: type as ResultItem['type'],
            data: data,
            feature: task.feature,
        };
        updateCurrentConversation(newResult);
        lastResult = data;
        
        if (sources && sources.length > 0) {
           const sourcesResult: ResultItem = {
              id: Date.now().toString() + Math.random() + '-sources',
              type: 'sources',
              data: sources,
              feature: task.feature,
           };
           updateCurrentConversation(sourcesResult);
        }
      }
    } catch (e: any) {
      console.error(e);
      let errorMessage = `Ocorreu um erro: ${e.message || 'Tente novamente.'}`;
      const isApiKeyError = e.message?.includes("Requested entity was not found.") || e.message?.includes("API Key must be set");

      if (isApiKeyError) {
        setApiKeyReady(false);
        errorMessage = "Sua chave de API parece ser inválida ou não foi definida. Por favor, selecione uma chave válida e tente novamente.";
      }
      
      setError(errorMessage);
      updateCurrentConversation({ id: Date.now().toString(), type: 'error', data: errorMessage, feature: Feature.Chat });
    } finally {
      setIsLoading(false);
      setPrompt('');
      setSelectedFile(null);
    }
  }, [prompt, selectedFile, isLoading, apiKeyReady, currentSessionId, sessions]);

  const getLoadingMessageForTask = (task: Task): string => {
    switch (task.feature) {
      case Feature.ImageGeneration: return 'Criando sua imagem...';
      case Feature.ImageEditing: return 'Editando sua imagem...';
      case Feature.VideoGeneration: return 'Gerando vídeo... Isso pode levar alguns minutos.';
      case Feature.TTS: return 'Gerando áudio...';
      case Feature.Search: return 'Pesquisando na web...';
      case Feature.Chat: return 'Pensando...';
      default: return 'Processando...';
    }
  };

  const currentConversation = sessions.find(s => s.id === currentSessionId)?.conversation || [];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {needsApiKey && <ApiKeySelector onKeySelected={handleApiKeySelected} />}
      <ChatHistory 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto p-4 pb-40">
          {currentConversation.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot size={64} className="text-gray-600 mb-4" />
                  <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                      AI Studio Universal
                  </h1>
                  <p className="text-gray-400 max-w-md">
                      Seu assistente de IA unificado. De imagens e vídeos a pesquisas e bate-papo, tudo em um só lugar. Como posso ajudar hoje?
                  </p>
                  {!isCheckingApiKey && !apiKeyReady && (
                    <div className="mt-4 bg-yellow-500/10 text-yellow-300 p-3 rounded-lg text-sm max-w-md">
                      Nenhuma chave de API encontrada. Você será solicitado a selecionar uma ao enviar seu primeiro prompt.
                    </div>
                  )}
              </div>
          )}
          <div className="max-w-4xl mx-auto space-y-4">
            {currentConversation.map(item =>
                item.type === 'user' ? (
                    <UserPromptDisplay key={item.id} item={item} />
                ) : (
                    <ResultDisplay key={item.id} result={item} onEditImageRequest={handleEditImageRequest}/>
                )
            )}
            {isLoading && <LoadingIndicator message={loadingMessage} />}
            <div ref={resultsEndRef} />
          </div>
        </main>
        <footer className="fixed bottom-0 left-0 lg:left-72 right-0 z-10">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading || isCheckingApiKey}
            onFileChange={setSelectedFile}
            selectedFile={selectedFile}
            onImprovePrompt={handleImprovePrompt}
            isImproving={isImproving}
          />
        </footer>
      </div>
    </div>
  );
};

export default App;
