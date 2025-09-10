import React, { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import type { Personality, AvatarColor } from './types';
import { isApiKeyAvailable } from './services/geminiService';

type View = 'login' | 'chat';

const ApiKeyErrorScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen p-4 text-center">
    <div className="w-full max-w-lg p-8 space-y-4 bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl shadow-red-500/10 border border-red-500/20">
      <h1 className="text-3xl font-bold text-red-400">خطأ في الإعداد</h1>
      <p className="text-gray-300">
        لم يتم العثور على مفتاح الواجهة البرمجية (API Key).
      </p>
      <p className="text-gray-400 text-sm">
        يرجى التأكد من أن متغير البيئة <code className="bg-white/10 px-1.5 py-1 rounded text-cyan-300">API_KEY</code> قد تم إعداده بشكل صحيح في بيئة التشغيل الخاصة بك.
      </p>
    </div>
  </div>
);


const App: React.FC = () => {
  if (!isApiKeyAvailable) {
    return <ApiKeyErrorScreen />;
  }

  const [view, setView] = useState<View>('login');
  const [username, setUsername] = useState<string>('');
  const [personality, setPersonality] = useState<Personality>('default');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('green');

  const handleLogin = useCallback((name: string, selectedPersonality: Personality, selectedAvatar: AvatarColor) => {
    if (name.trim()) {
      setUsername(name.trim());
      setPersonality(selectedPersonality);
      setAvatarColor(selectedAvatar);
      setView('chat');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUsername('');
    setPersonality('default');
    setAvatarColor('green');
    setView('login');
  }, []);

  return (
    <div className="bg-black/50 text-white min-h-screen font-sans">
      {view === 'login' ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ChatScreen
          username={username}
          personality={personality}
          avatarColor={avatarColor}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;