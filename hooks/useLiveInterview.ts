import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewConfig, TranscriptItem, InterviewStatus } from '../types';
import { base64ToUint8Array, createPcmBlob, decodeAudioData } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const useLiveInterview = () => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevels, setVolumeLevels] = useState({ user: 0, ai: 0 });

  // Refs for audio context and connection to avoid re-renders
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Transcript buffers
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  const connect = useCallback(async (config: InterviewConfig) => {
    if (!process.env.API_KEY) {
      setError("API Key is missing.");
      setStatus(InterviewStatus.ERROR);
      return;
    }

    try {
      setStatus(InterviewStatus.CONNECTING);
      setError(null);

      // Initialize Audio Contexts
      // Input: 16kHz for the model
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for the model response
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const sysInstruction = `You are a professional, yet friendly technical interviewer for a ${config.role} position. 
      The candidate has an experience level of: ${config.experienceLevel}.
      Focus the interview on: ${config.focusArea}.
      
      Guidelines:
      1. Ask clear, concise questions one at a time.
      2. Listen to the user's answer completely.
      3. Provide brief, constructive acknowledgment before moving to the next question.
      4. If the user struggles, offer a small hint.
      5. Keep your responses relatively short (under 30 seconds) to maintain a conversational flow.
      6. Start by welcoming the candidate and asking them to introduce themselves.`;

      // Start Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: sysInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setStatus(InterviewStatus.ACTIVE);

            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceNodeRef.current = source;
            
            // Use ScriptProcessor for basic streaming (simpler for single-file constraints than Worklet)
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter for user
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevels(prev => ({ ...prev, user: Math.min(rms * 5, 1) }));

              const pcmBlob = createPcmBlob(inputData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              // Ensure sync
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBytes = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              const gainNode = ctx.createGain();
              // AI Volume visualization
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 32;
              source.connect(analyser);
              
              // We need to poll the analyser to update React state for visualization
              const updateAiVol = () => {
                  // Check if context is still valid/active
                  if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') return;
                  
                  const dataArray = new Uint8Array(analyser.frequencyBinCount);
                  analyser.getByteFrequencyData(dataArray);
                  const avg = dataArray.reduce((a,b) => a+b, 0) / dataArray.length;
                  setVolumeLevels(prev => ({ ...prev, ai: avg / 255 }));
                  if (ctx.currentTime < nextStartTimeRef.current) {
                      requestAnimationFrame(updateAiVol);
                  } else {
                      setVolumeLevels(prev => ({ ...prev, ai: 0 }));
                  }
              };
              updateAiVol();

              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }

            // Handle Transcription
            const outputText = message.serverContent?.outputTranscription?.text;
            const inputText = message.serverContent?.inputTranscription?.text;
            const turnComplete = message.serverContent?.turnComplete;

            if (outputText) {
                currentOutputTranscriptionRef.current += outputText;
                // Update partial transcript UI if needed
            }
            if (inputText) {
                currentInputTranscriptionRef.current += inputText;
            }

            if (turnComplete) {
                const userText = currentInputTranscriptionRef.current.trim();
                const aiText = currentOutputTranscriptionRef.current.trim();

                if (userText) {
                    setTranscripts(prev => [...prev, {
                        id: Date.now() + '-user',
                        speaker: 'user',
                        text: userText,
                        timestamp: new Date()
                    }]);
                }
                if (aiText) {
                    setTranscripts(prev => [...prev, {
                        id: Date.now() + '-ai',
                        speaker: 'ai',
                        text: aiText,
                        timestamp: new Date()
                    }]);
                }

                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
                nextStartTimeRef.current = 0;
                // In a real app, we would cancel currently playing nodes here
                currentOutputTranscriptionRef.current = ''; // clear interrupted speech
            }
          },
          onclose: () => {
            console.log('Session closed');
            setStatus(InterviewStatus.COMPLETED);
          },
          onerror: (err) => {
            console.error('Session error:', err);
            setError("Connection error. Please try again.");
            setStatus(InterviewStatus.ERROR);
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to start interview session.");
      setStatus(InterviewStatus.ERROR);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    // Note: The SDK doesn't expose a direct .close() on the session promise result easily
    // in the example, but we can assume closing the socket or refreshing works.
    // For now, we reset state.
    setStatus(InterviewStatus.COMPLETED);
  }, []);

  return {
    status,
    transcripts,
    error,
    volumeLevels,
    connect,
    disconnect
  };
};