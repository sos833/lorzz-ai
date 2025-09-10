import { useState, useEffect, useCallback } from 'react';
// 1. استيراد دالتنا الجديدة والبسيطة من الخدمة
import { getAiResponse } from '../services/geminiService'; 
// ملاحظة: اسم الملف لم نغيره لتجنب الارتباك، لكنه الآن يتصل بـ Hugging Face
import type { ChatMessage, Personality } from '../types';

// لم نعد بحاجة لدالة fileToGenerativePart لأن النموذج الحالي نصي فقط.
// لم نعد بحاجة لنوع Source.

// دالة معالجة الأخطاء لا تزال مفيدة
const getErrorMessage = (error: unknown): string => {
    console.error("Error during API call:", error);
    if (error instanceof Error) {
        if (error.message.includes("is currently loading")) {
            return "النموذج الذكي قيد التحميل حاليًا. يرجى المحاولة مرة أخرى بعد لحظات.";
        }
        return `حدث خطأ: ${error.message}`;
    }
    return "عذراً، حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
};

// دالة إنشاء رسالة الترحيب (لا تغيير هنا)
const createWelcomeMessage = (username: string, personality: Personality): ChatMessage => {
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
  // لم نعد بحاجة لـ chatRef لأننا لا نستخدم جلسات
  const storageKey = `chatHistory-${username}-${personality}`;

  // Effect لتهيئة الرسائل من الذاكرة المحلية
  useEffect(() => {
    // تم تبسيط هذا الجزء لإزالة منطق إنشاء الجلسة
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

  // Effect لحفظ الرسائل (لا تغيير هنا)
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // 2. ✨ التعديل الأهم: تبسيط دالة sendMessage بالكامل ✨
  const sendMessage = useCallback(async (text: string, file: File | null = null) => {
    if (!text.trim() || isLoading) return;

    // النموذج الحالي لا يدعم الملفات، لذلك سننبه المستخدم
    if (file) {
      alert("عذرًا، إرسال الملفات غير مدعوم حاليًا. سيتم تجاهل الملف المرفق.");
    }

    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: username,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // لم نعد بحاجة للرسالة المؤقتة أو البث المباشر

    try {
      // بناء prompt بسيط يتضمن الشخصية (هذا يحسن من جودة الرد)
      const fullPrompt = `Personality: ${personality}. User query: ${text}`;
      
      // استدعاء دالتنا الجديدة البسيطة والمباشرة
      const aiResponseText = await getAiResponse(fullPrompt);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: 'Lorzz AI',
        timestamp: new Date(),
      };
      
      // إضافة رسالة الذكاء الاصطناعي الكاملة مرة واحدة
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const userFriendlyMessage = getErrorMessage(error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: userFriendlyMessage,
        sender: 'Lorzz AI',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, username, personality, storageKey]);

  return { messages, sendMessage, isLoading };
};