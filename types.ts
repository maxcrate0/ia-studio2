
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

// FIX: All declarations of 'aistudio' must have identical modifiers. This was caused by a duplicate global declaration in `src/types.ts`. Commenting this out to resolve the conflict.
/*
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}
*/
