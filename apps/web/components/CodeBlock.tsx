'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

export default function CodeBlock({
  code,
  language = 'text',
  title,
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for common languages
  const highlightCode = (code: string, lang: string) => {
    const keywords = {
      javascript: [
        'const',
        'let',
        'var',
        'function',
        'return',
        'if',
        'else',
        'for',
        'while',
        'try',
        'catch',
        'async',
        'await',
        'import',
        'export',
        'default',
      ],
      python: [
        'def',
        'return',
        'if',
        'elif',
        'else',
        'for',
        'while',
        'try',
        'except',
        'import',
        'from',
        'as',
        'class',
        'with',
      ],
      bash: [
        'curl',
        'wget',
        'grep',
        'sed',
        'awk',
        'echo',
        'export',
        'if',
        'then',
        'else',
        'fi',
        'for',
        'do',
        'done',
      ],
      json: [],
      curl: ['curl', '-X', '-H', '-d', '--data', '--header'],
    };

    const langKeywords = keywords[lang as keyof typeof keywords] || [];

    let highlighted = code;

    // Highlight strings
    highlighted = highlighted.replace(
      /"([^"\\]|\\.)*"/g,
      '<span class="text-green-600 dark:text-green-400">"$1"</span>'
    );
    highlighted = highlighted.replace(
      /'([^'\\]|\\.)*'/g,
      '<span class="text-green-600 dark:text-green-400">\'$1\'</span>'
    );

    // Highlight comments
    if (lang === 'javascript' || lang === 'curl') {
      highlighted = highlighted.replace(
        /(\/\/.*$)/gm,
        '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
      );
    }
    if (lang === 'python' || lang === 'bash') {
      highlighted = highlighted.replace(
        /(#.*$)/gm,
        '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
      );
    }

    // Highlight keywords
    langKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(
        regex,
        `<span class="text-blue-600 dark:text-blue-400 font-semibold">${keyword}</span>`
      );
    });

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b\d+\.?\d*\b/g,
      '<span class="text-orange-600 dark:text-orange-400">$&</span>'
    );

    // Highlight URLs
    highlighted = highlighted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<span class="text-blue-600 dark:text-blue-400 underline">$1</span>'
    );

    return highlighted;
  };

  return (
    <div className="relative">
      {title && (
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          {language && (
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {language}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
          <code
            className="text-gray-900 dark:text-gray-100 font-mono leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
          />
        </pre>

        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
