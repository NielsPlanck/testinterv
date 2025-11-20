export enum InterviewStatus {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface InterviewConfig {
  role: string;
  experienceLevel: string;
  focusArea: string;
}

export interface TranscriptItem {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
}

export interface AudioVisualizerState {
  userVolume: number;
  aiVolume: number;
}