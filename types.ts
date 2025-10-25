
export enum Feature {
  ImageGeneration = 'IMAGE_GENERATION',
  ImageEditing = 'IMAGE_EDITING',
  VideoGeneration = 'VIDEO_GENERATION',
  TTS = 'TTS',
  Search = 'SEARCH',
  Chat = 'CHAT',
}

export interface Task {
  feature: Feature;
  prompt: string;
}

export interface DispatchResponse {
  tasks: Task[];
}

export interface ResultItem {
  id: string;
  type: 'user' | 'text' | 'image' | 'video' | 'audio' | 'error' | 'sources';
  data: any; 
  feature?: Feature;
  userImage?: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  conversation: ResultItem[];
}


// This is a global declaration for the aistudio object for TypeScript

// FIX: Moved the AIStudio interface outside of the `declare global` block to prevent potential redeclaration issues
// that can cause "All declarations of '...' must have identical modifiers" errors.
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// FIX: Centralizing the global declaration in this file to resolve conflicts with a duplicate in src/types.ts.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}
