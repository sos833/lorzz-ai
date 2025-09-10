// src/services/geminiService.ts

// نختار نموذجًا قويًا ومتاحًا مجانًا من Hugging Face
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";

// 1. قراءة مفتاح Hugging Face
const apiKey = import.meta.env.VITE_HUGGINGFACE_TOKEN;

// 2. التحقق من وجود المفتاح
export const isApiKeyAvailable: boolean = !!apiKey;

// هذه الدالة ستحل محل كل منطق Gemini السابق
// سنقوم بتصدير دالة واحدة فقط لتسهيل الأمر
export const getAiResponse = async (prompt: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Hugging Face API token is not available.");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { // يمكننا التحكم في سلوك النموذج من هنا
                    max_new_tokens: 512,
                    temperature: 0.7,
                    return_full_text: false,
                }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            // رسالة خطأ واضحة إذا كان النموذج لا يزال قيد التحميل
            if (errorBody.error && errorBody.error.includes("is currently loading")) {
                 return "النموذج الذكي قيد التحميل حاليًا. قد يستغرق الأمر دقيقة واحدة. يرجى المحاولة مرة أخرى بعد قليل.";
            }
            throw new Error(`Hugging Face API error: ${response.statusText} - ${errorBody.error || ''}`);
        }

        const result = await response.json();
        // Hugging Face ترجع النص داخل [{ generated_text: "..." }]
        if (result && Array.isArray(result) && result[0].generated_text) {
            return result[0].generated_text.trim();
        } else {
            throw new Error("Unexpected response format from Hugging Face API.");
        }

    } catch (error) {
        console.error("Error calling Hugging Face API:", error);
        // نرجع رسالة خطأ واضحة للمستخدم
        if (error instanceof Error) {
            return `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}`;
        }
        return "حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي.";
    }
};