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

// FIX: To resolve the redeclaration error for 'aistudio', the `AIStudio` interface is no longer exported from this file.
// It is now a local interface used only for the global declaration, which avoids a naming conflict with the
// identical interface exported from the root `types.ts` file.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}
