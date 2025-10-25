import React from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ sessions, currentSessionId, onNewChat, onSelectChat, onDeleteChat }) => {
  return (
    <aside className="w-72 bg-gray-900/70 backdrop-blur-md border-r border-gray-800 flex-col hidden lg:flex">
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Chat
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              session.id === currentSessionId ? 'bg-gray-700/80' : 'hover:bg-gray-800/60'
            }`}
            onClick={() => onSelectChat(session.id)}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-300 truncate flex-1">
                {session.title}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(session.id);
              }}
              className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Deletar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default ChatHistory;
