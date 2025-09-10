import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon } from './icons/CopyIcon';

interface CodeBlockProps {
    language: string;
    children: React.ReactNode;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (typeof children === 'string') {
            navigator.clipboard.writeText(children);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="my-4 rounded-lg overflow-hidden bg-[#272822] border border-gray-700">
            <div className="flex justify-between items-center px-4 py-2 bg-black/30">
                <span className="text-xs font-sans text-gray-400 capitalize">{language}</span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    <CopyIcon />
                    {isCopied ? 'تم النسخ!' : 'نسخ الكود'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={okaidia}
                customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem' }}
                codeTagProps={{className: 'text-sm font-mono'}}
            >
                {String(children)}
            </SyntaxHighlighter>
        </div>
    );
};
