import { useState, useEffect, useRef, useCallback } from 'react';

// For browsers that still use prefixes
// FIX: Add missing type definitions for Web Speech API to fix TypeScript errors.
declare global {
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    stop(): void;
    start(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
  }
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognitionAPI;

export const useSpeechRecognition = (onTranscriptUpdate: (transcript: string) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!isSpeechRecognitionSupported) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            onTranscriptUpdate(transcript);
        };
        
        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.stop();
        };
    }, [onTranscriptUpdate]);

    const toggleRecording = useCallback(() => {
        if (!recognitionRef.current) return;
        
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            onTranscriptUpdate('');
            recognitionRef.current.start();
        }
    }, [isRecording, onTranscriptUpdate]);

    return { isRecording, toggleRecording, isSpeechRecognitionSupported };
};
