import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { ChatMessage, Personality, AvatarColor } from '../types';
import { avatarColorStyles } from '../types';
import { SendIcon } from './icons/SendIcon';
import { LinkIcon } from './icons/LinkIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { CodeBlock } from './CodeBlock';


interface ChatScreenProps {
  username: string;
  personality: Personality;
  avatarColor: AvatarColor;
  onLogout: () => void;
}

const UserAvatar: React.FC<{ name: string; color: AvatarColor }> = ({ name, color }) => {
    const isAI = name === 'Lorzz AI';
    const initial = isAI ? 'L' : name.charAt(0).toUpperCase();

    const aiStyles = { ring: 'ring-cyan-400', shadow: 'shadow-[0_0_10px_theme(colors.cyan.400)]' };
    const userStyles = avatarColorStyles[color];

    const glowClass = isAI ? `${aiStyles.ring} ${aiStyles.shadow}` : `${userStyles.ring} ${userStyles.shadow}`;

    return (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl bg-black/50 ring-2 ${glowClass}`}>
            {initial}
        </div>
    );
};


const Message: React.FC<{ message: ChatMessage; userAvatarColor: AvatarColor }> = ({ message, userAvatarColor }) => {
    const { text, sender, timestamp, isStreaming, sources, file } = message;
    const isAI = sender === 'Lorzz AI';
    const messageBubbleClass = isAI 
        ? 'bg-black/30 border border-cyan-500/30' 
        : 'bg-gray-800/50';
    const userTextColor = `text-${userAvatarColor}-300`;

    return (
        <div className="flex items-start gap-4 p-4">
            <UserAvatar name={sender} color={userAvatarColor} />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className={`font-bold ${isAI ? 'text-cyan-300' : 'text-green-300'}`}>{sender}</span>
                    <span className="text-xs text-gray-500">{new Date(timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className={`mt-2 p-4 rounded-lg rounded-tl-none ${messageBubbleClass}`}>
                  {file && (
                      <div className="mb-2">
                          <img src={file.url} alt={file.name} className="max-w-xs max-h-64 rounded-lg border border-gray-700" />
                      </div>
                  )}
                  
                  {text && (
                     // FIX: The `className` prop was moved from `ReactMarkdown` to this wrapping `div`. The `ReactMarkdown` component does not accept a `className` prop, and the Tailwind Typography (`prose`) classes need to be on a container.
                     <div className="text-gray-200 prose prose-invert prose-p:whitespace-pre-wrap max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code(props) {
                                    const { children, className, node, ...rest } = props;
                                    const match = /language-(\w+)/.exec(className || '');
                                    return match ? (
                                        <CodeBlock language={match[1]}>
                                            {String(children).replace(/\n$/, '')}
                                        </CodeBlock>
                                    ) : (
                                        <code {...rest} className="bg-gray-700/50 rounded px-1.5 py-1 text-sm font-mono text-cyan-300">
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {text}
                        </ReactMarkdown>
                        {isStreaming && <span className="inline-block w-2.5 h-5 ml-1 bg-cyan-400 animate-pulse rounded-full align-bottom"></span>}
                    </div>
                  )}
                </div>
                
                {sources && sources.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">المصادر</h4>
                        <div className="flex flex-col space-y-2">
                            {sources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-2 transition-colors"
                                    aria-label={`Source: ${source.title}`}
                                >
                                    <LinkIcon />
                                    <span className="truncate">{source.title}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ username, personality, avatarColor, onLogout }) => {
  const { messages, sendMessage, isLoading } = useChat(username, personality);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, toggleRecording, isSpeechRecognitionSupported } = useSpeechRecognition(setInput);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || file) {
      sendMessage(input, file);
      setInput('');
      removeFile();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  return (
    <div className="flex h-screen text-gray-200">
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black/30">
        <header className="h-16 flex-shrink-0 flex items-center px-6 border-b border-cyan-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-lg">
          <h2 className="text-lg font-semibold text-white"># القناة-العامة</h2>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div>
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} userAvatarColor={avatarColor} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
        
        <footer className="p-4 flex-shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            {filePreview && (
              <div className="bg-black/50 backdrop-blur-lg border border-cyan-500/20 p-2 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                      <span className="text-sm text-gray-300 truncate">{file?.name}</span>
                  </div>
                  <button 
                      onClick={removeFile} 
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                      aria-label="Remove file"
                  >
                      <XCircleIcon />
                  </button>
              </div>
            )}
            <form onSubmit={handleSend} className={`bg-black/50 backdrop-blur-lg border border-cyan-500/20 flex items-center p-2 gap-2 ${filePreview ? 'rounded-b-lg' : 'rounded-lg'}`}>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
              />
              <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-cyan-300 transition-colors"
                  aria-label="Attach file"
              >
                  <PaperclipIcon />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "...جارِ الاستماع" : "اسأل لورز..."}
                className="flex-1 bg-transparent px-2 py-2 text-white placeholder-gray-400 focus:outline-none"
                disabled={isLoading}
              />
              {isSpeechRecognitionSupported && (
                <button 
                  type="button" 
                  onClick={toggleRecording} 
                  className={`p-2 rounded-md hover:bg-white/10 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-300 hover:text-cyan-300'}`}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <MicrophoneIcon />
                </button>
              )}
              <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !file)} 
                className="p-2 rounded-md bg-cyan-500/80 text-white hover:bg-cyan-400/90 disabled:bg-cyan-500/20 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_10px_theme(colors.cyan.500)]"
              >
                <SendIcon />
              </button>
            </form>
           </div>
        </footer>
      </div>

       {/* Right Sidebar - User List */}
       <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col">
          <div className="px-4 h-16 flex items-center border-b border-cyan-500/20 shadow-lg shadow-purple-500/10">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Lorzz</h1>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">المتواجدون — 2</h3>
             <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                    <UserAvatar name={username} color={avatarColor} />
                    <span className={`font-semibold text-green-300`}>{username}</span>
                </div>
                <div className="flex items-center gap-3">
                    <UserAvatar name="Lorzz AI" color="green" />
                    <span className="font-semibold text-cyan-300">Lorzz AI</span>
                </div>
             </div>
          </div>
           <div className="p-2 border-t border-cyan-500/20">
            <div className="flex items-center gap-2 p-2 rounded-md bg-black/40">
                <UserAvatar name={username} color={avatarColor} />
                <span className="font-semibold text-white truncate flex-1">{username}</span>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="تسجيل الخروج"
                >
                  <LogoutIcon />
                </button>
            </div>
        </div>
       </aside>
    </div>
  );
};

export default ChatScreen;