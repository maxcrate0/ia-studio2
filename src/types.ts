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

// FIX: To resolve the redeclaration error for 'aistudio', the AIStudio interface and global declaration
// have been removed from this file. The project now relies on the single source of truth
// in the root `types.ts` file.
