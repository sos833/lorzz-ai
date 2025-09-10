import React, { useState } from 'react';
import type { Personality, AvatarColor } from '../types';
import { avatarOptions, avatarColorStyles } from '../types';

interface LoginScreenProps {
  onLogin: (name: string, personality: Personality, avatarColor: AvatarColor) => void;
}

const personalityOptions: { value: Personality; label: string; description: string }[] = [
    { value: 'default', label: 'المساعد الافتراضي', description: 'واسع المعرفة ومفيد.' },
    { value: 'technical', label: 'الخبير التقني', description: 'دقيق ومختص بالبرمجة.' },
    { value: 'creative', label: 'الكاتب المبدع', description: 'خيالي وملهم للكتابة.' },
    { value: 'sarcastic', label: 'الصديق الساخر', description: 'ذكي وذو حس فكاهي لاذع.' }
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>('default');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarColor>('green');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name, selectedPersonality, selectedAvatar);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-lg p-8 space-y-8 bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/10 border border-cyan-500/20">
        <div className="text-center">
          <h1 
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
            style={{filter: `drop-shadow(0 0 15px var(--glow-cyan)) drop-shadow(0 0 40px var(--glow-purple))`}}
          >
            Lorzz
          </h1>
          <p className="mt-4 text-gray-300">أطلق العنان لقوة الذكاء الخارق</p>
        </div>
        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <div className="relative">
             <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="peer relative block w-full px-4 py-3 text-lg text-white placeholder-transparent bg-white/5 border-2 border-cyan-500/30 rounded-lg focus:outline-none focus:ring-0 focus:border-cyan-400 transition-colors"
                placeholder="ادخل اسمك هنا"
              />
               <label 
                htmlFor="name" 
                className="absolute right-4 -top-3.5 text-cyan-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-cyan-400 peer-focus:text-sm"
               >
                اسم المستخدم
              </label>
          </div>
          
          <div className="space-y-4">
            <label className="block text-center text-sm font-medium text-gray-300">
              اختر شخصية لورز
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {personalityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedPersonality(option.value)}
                  className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                    selectedPersonality === option.value
                      ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,246,255,0.5)]'
                      : 'border-gray-600/50 bg-white/5 hover:border-cyan-500/70 hover:bg-cyan-500/10'
                  }`}
                  aria-pressed={selectedPersonality === option.value}
                >
                  <span className="block font-semibold text-white text-sm">{option.label}</span>
                  <span className="block text-xs text-gray-400 mt-1">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
          
           <div className="space-y-4">
            <label className="block text-center text-sm font-medium text-gray-300">
              اختر لون الأفاتار
            </label>
            <div className="flex justify-center gap-3">
              {avatarOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedAvatar(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    selectedAvatar === color
                      ? `${avatarColorStyles[color].ring} ${avatarColorStyles[color].shadow} scale-110`
                      : 'border-gray-600/50'
                  }`}
                  style={{ backgroundColor: `theme(colors.${color}.500)`}}
                  aria-label={`Select ${color} avatar`}
                  aria-pressed={selectedAvatar === color}
                />
              ))}
            </div>
          </div>


          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-cyan-600/50 hover:bg-cyan-500/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-cyan-500 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,246,255,0.5)] hover:shadow-[0_0_25px_rgba(0,246,255,0.8)]"
              disabled={!name.trim()}
            >
              دردش الآن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;