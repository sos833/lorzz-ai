export interface Source {
  uri: string;
  title: string;
}

export type Personality = 'default' | 'technical' | 'creative' | 'sarcastic';

export type AvatarColor = 'green' | 'purple' | 'red' | 'yellow' | 'blue';

export const avatarOptions: AvatarColor[] = ['green', 'purple', 'red', 'yellow', 'blue'];

export const avatarColorStyles: Record<AvatarColor, { ring: string; shadow: string }> = {
    green: { ring: 'ring-green-400', shadow: 'shadow-[0_0_10px_theme(colors.green.400)]' },
    purple: { ring: 'ring-purple-400', shadow: 'shadow-[0_0_10px_theme(colors.purple.400)]' },
    red: { ring: 'ring-red-400', shadow: 'shadow-[0_0_10px_theme(colors.red.400)]' },
    yellow: { ring: 'ring-yellow-400', shadow: 'shadow-[0_0_10px_theme(colors.yellow.400)]' },
    blue: { ring: 'ring-blue-400', shadow: 'shadow-[0_0_10px_theme(colors.blue.400)]' },
};

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: Source[];
  file?: {
    url: string;
    name: string;
    type: string;
  };
}