import { useState, useEffect, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import type { ChatMessage, Source, Personality } from '../types';

// Helper to convert File to a GoogleGenerativeAI.Part object.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const getErrorMessage = (error: unknown): string => {
    console.error("Error during API call:", error);

    if (error instanceof Error) {
        // Network errors often manifest as TypeErrors from the underlying fetch call.
        if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
            return "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.";
        }

        // The @google/genai library often includes HTTP status codes in the message for failed requests.
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('400')) {
             // 400 can be a malformed request or invalid API key. We'll show a generic but slightly more specific error.
             return "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
        }
        
        if (errorMessage.includes('429')) {
             return "لقد أرسلت طلبات كثيرة جدًا. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
        }
        
        if (errorMessage.includes('500') || errorMessage.includes('503')) {
             return "الخدمة غير متاحة حاليًا أو تواجه ضغطًا. يرجى المحاولة مرة أخرى لاحقاً.";
        }
    }
    
    // A default message for other unexpected errors.
    return "عذراً، حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
};

// Helper function to generate the appropriate welcome message based on personality.
const createWelcomeMessage = (username: string, personality: Personality): ChatMessage => {
    let welcomeText: string;

    switch(personality) {
        case 'technical':
            welcomeText = `النظام متصل. أنا لورز، الخبير التقني. اطرح استفسارك يا ${username}.`;
            break;
        case 'creative':
            welcomeText = `أهلاً بك في عالم الخيال يا ${username}! أنا لورز، رفيقك في رحلة الإبداع. ماذا سنكتب اليوم؟`;
            break;
        case 'sarcastic':
            welcomeText = `يا للسعادة، مستخدم آخر. ${username}، أليس كذلك؟ حسناً، أنا لورز. ماذا تريد؟ أنا مشغول للغاية كما تعلم.`;
            break;
        case 'default':
        default:
            welcomeText = `مرحباً بك يا ${username}! أنا لورز، مساعدك الذكي الفائق. أنا هنا لمساعدتك في أي شيء. كيف يمكنني إبهارك اليوم؟`;
            break;
    }

    return {
        id: 'welcome-message',
        text: welcomeText,
        sender: 'Lorzz AI',
        timestamp: new Date(),
    };
};


export const useChat = (username: string, personality: Personality) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatRef = useRef<Chat | null>(null);
  const storageKey = `chatHistory-${username}-${personality}`;

  // Effect for initializing chat and loading/creating messages
  useEffect(() => {
    // Create a new chat session whenever the personality changes.
    chatRef.current = createChatSession(personality);
    
    const savedMessagesRaw = localStorage.getItem(storageKey);

    if (savedMessagesRaw) {
        try {
            const savedMessages = JSON.parse(savedMessagesRaw).map((msg: ChatMessage) => ({
                ...msg,
                timestamp: new Date(msg.timestamp) // Re-hydrate Date objects
            }));
            setMessages(savedMessages);
        } catch (e) {
            console.error("Failed to parse chat history, starting fresh.", e);
            localStorage.removeItem(storageKey); // Clear corrupted data
            // If history is corrupt, start a new chat with a welcome message.
            setMessages([createWelcomeMessage(username, personality)]);
        }
    } else {
        // If no history is found (e.g., after a personality change),
        // start a new chat with the personality-specific welcome message.
        setMessages([createWelcomeMessage(username, personality)]);
    }
  }, [username, personality, storageKey]);

  // Effect for saving messages to localStorage
  useEffect(() => {
    // Don't save if it's just the initial welcome message
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome-message')) {
      const messagesToSave = messages.map(msg => {
        // Exclude the 'file' property as its URL is temporary and cannot be persisted.
        const { file, ...restOfMsg } = msg;
        return restOfMsg;
      });
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    }
  }, [messages, storageKey]);


  const sendMessage = useCallback(async (text: string, file: File | null = null) => {
    if ((!text.trim() && !file) || isLoading || !chatRef.current) return;

    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: username,
      timestamp: new Date(),
    };

    if (file) {
      userMessage.file = {
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      };
    }
    
    setMessages(prev => [...prev, userMessage]);
    
    const aiMessageId = `ai-${Date.now()}`;
    const aiPlaceholderMessage: ChatMessage = {
        id: aiMessageId,
        text: '',
        sender: 'Lorzz AI',
        timestamp: new Date(),
        isStreaming: true,
    };
    setMessages(prev => [...prev, aiPlaceholderMessage]);

    try {
      const parts: any[] = [{ text }];
      if (file) {
        const imagePart = await fileToGenerativePart(file);
        parts.unshift(imagePart); // Image part first for better context
      }

      const stream = await chatRef.current.sendMessageStream({ message: parts });
      let accumulatedText = '';
      const groundingChunks = new Map<string, Source>();


      for await (const chunk of stream) {
        accumulatedText += chunk.text;
         chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(gc => {
            if (gc.web && gc.web.uri) {
                groundingChunks.set(gc.web.uri, { uri: gc.web.uri, title: gc.web.title || gc.web.uri });
            }
        });
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
        ));
      }
      
      const sources = Array.from(groundingChunks.values());

      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, isStreaming: false, sources: sources.length > 0 ? sources : undefined } : msg
      ));

    } catch (error) {
      const userFriendlyMessage = getErrorMessage(error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: userFriendlyMessage,
        sender: 'Lorzz AI',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.filter(m => m.id !== aiMessageId), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, username, storageKey]); // Added storageKey dependency to sendMessage

  return { messages, sendMessage, isLoading };
};