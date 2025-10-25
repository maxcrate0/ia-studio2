import React from 'react';
import { ResultItem } from '../types';
import { User } from 'lucide-react';

interface UserPromptDisplayProps {
  item: ResultItem;
}

const UserPromptDisplay: React.FC<UserPromptDisplayProps> = ({ item }) => {
  return (
    <div className="w-full mb-4 flex gap-4">
      <User className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
      <div className="w-full bg-gray-800/30 rounded-xl p-4">
        {item.userImage && (
          <img src={item.userImage} alt="User upload" className="max-w-xs max-h-48 rounded-lg mb-3" />
        )}
        <p className="whitespace-pre-wrap text-gray-200">{item.data}</p>
      </div>
    </div>
  );
};

export default UserPromptDisplay;
