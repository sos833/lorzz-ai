import React, { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import type { Personality, AvatarColor } from './types';

type View = 'login' | 'chat';

const App: React.FC = () => {
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