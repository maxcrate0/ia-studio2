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
