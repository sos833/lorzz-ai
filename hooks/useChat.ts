import { useState, useEffect, useCallback, useRef } from 'react';
// 1. تحديث النوع (Type) ليكون أكثر دقة
import { ChatSession } from '@google/generative-ai'; 
import { createChatSession } from '../services/geminiService';
import type { ChatMessage, Source, Personality } from '../types';

// Helper to convert File to a GoogleGenerativeAI.Part object. (لا تغيير هنا)
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

// دالة معالجة الأخطاء (لا تغيير هنا، عملها ممتاز)
const getErrorMessage = (error: unknown): string => {
    // ... (الكود الخاص بك كما هو)
    console.error("Error during API call:", error);

    if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
            return "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.";
        }
        const errorMessage = error.message || '';
        if (errorMessage.includes('400')) {
             return "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
        }
        if (errorMessage.includes('429')) {
             return "لقد أرسلت طلبات كثيرة جدًا. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
        }
        if (errorMessage.includes('500') || errorMessage.includes('503')) {
             return "الخدمة غير متاحة حاليًا أو تواجه ضغطًا. يرجى المحاولة مرة أخرى لاحقاً.";
        }
    }
    return "عذراً، حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
};

// دالة إنشاء رسالة الترحيب (لا تغيير هنا)
const createWelcomeMessage = (username: string, personality: Personality): ChatMessage => {
    // ... (الكود الخاص بك كما هو)
    let welcomeText: string;
    switch(personality) {
        case 'technical': welcomeText = `النظام متصل. أنا لورز، الخبير التقني. اطرح استفسارك يا ${username}.`; break;
        case 'creative': welcomeText = `أهلاً بك في عالم الخيال يا ${username}! أنا لورز، رفيقك في رحلة الإبداع. ماذا سنكتب اليوم؟`; break;
        case 'sarcastic': welcomeText = `يا للسعادة، مستخدم آخر. ${username}، أليس كذلك؟ حسناً، أنا لورز. ماذا تريد؟ أنا مشغول للغاية كما تعلم.`; break;
        default: welcomeText = `مرحباً بك يا ${username}! أنا لورز، مساعدك الذكي الفائق. أنا هنا لمساعدتك في أي شيء. كيف يمكنني إبهارك اليوم؟`; break;
    }
    return { id: 'welcome-message', text: welcomeText, sender: 'Lorzz AI', timestamp: new Date() };
};

export const useChat = (username: string, personality: Personality) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 2. تحديث النوع هنا أيضًا
  const chatRef = useRef<ChatSession | null>(null); 
  const storageKey = `chatHistory-${username}-${personality}`;

  // Effect for initializing chat (لا تغيير هنا)
  useEffect(() => {
    const session = createChatSession(personality);
    if (!session) {
      setMessages([{
        id: 'error-no-session',
        text: 'فشل تهيئة جلسة الدردشة. هذا يحدث عادةً بسبب عدم وجود مفتاح API صالح.',
        sender: 'System',
        timestamp: new Date()
      }]);
      return;
    }
    chatRef.current = session;
    const savedMessagesRaw = localStorage.getItem(storageKey);
    if (savedMessagesRaw) {
        try {
            const savedMessages = JSON.parse(savedMessagesRaw).map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
            setMessages(savedMessages);
        } catch (e) {
            localStorage.removeItem(storageKey);
            setMessages([createWelcomeMessage(username, personality)]);
        }
    } else {
        setMessages([createWelcomeMessage(username, personality)]);
    }
  }, [username, personality, storageKey]);

  // Effect for saving messages (لا تغيير هنا)
  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && !messages[0].id.startsWith('welcome') && !messages[0].id.startsWith('error'))) {
      const messagesToSave = messages.map(msg => {
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
      id: `user-${Date.now()}`, text, sender: username, timestamp: new Date(),
    };
    if (file) {
      userMessage.file = { url: URL.createObjectURL(file), name: file.name, type: file.type };
    }
    setMessages(prev => [...prev, userMessage]);
    
    const aiMessageId = `ai-${Date.now()}`;
    const aiPlaceholderMessage: ChatMessage = {
        id: aiMessageId, text: '', sender: 'Lorzz AI', timestamp: new Date(), isStreaming: true,
    };
    setMessages(prev => [...prev, aiPlaceholderMessage]);

    try {
      const parts: (string | { inlineData: { data: string; mimeType: string; } })[] = [];
      if (file) {
        const imagePart = await fileToGenerativePart(file);
        parts.push(imagePart);
      }
      // أضف النص دائمًا
      parts.push(text);
      
      // 3. ✨ الإصلاح الرئيسي هنا ✨
      const stream = await chatRef.current.sendMessageStream(parts);

      let accumulatedText = '';
      const groundingChunks = new Map<string, Source>();

      for await (const chunk of stream.stream) { // لاحظ .stream الإضافية
        const chunkText = chunk.text(); // استخدم دالة text()
        if (chunkText) {
          accumulatedText += chunkText;
        }

        chunk.candidates?.[0]?.groundingAttributions?.forEach(att => {
            if (att.web && att.web.uri) {
                groundingChunks.set(att.web.uri, { uri: att.web.uri, title: att.web.title || att.web.uri });
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
        id: `error-${Date.now()}`, text: userFriendlyMessage, sender: 'Lorzz AI', timestamp: new Date(),
      };
      setMessages(prev => [...prev.filter(m => m.id !== aiMessageId), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, username, storageKey]);

  return { messages, sendMessage, isLoading };
};