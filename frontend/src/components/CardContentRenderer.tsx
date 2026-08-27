import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css';

interface CardContentRendererProps {
  content: string;
  className?: string;
}

export const CardContentRenderer: React.FC<CardContentRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Trigger Prism syntax highlighting
    Prism.highlightAllUnder(containerRef.current);

    // Process KaTeX inline & display math
    // Render $$...$$ or \[...\] display math
    // Render $...$ or \(...\) inline math
    const mathNodes = containerRef.current.querySelectorAll('.katex-render');
    mathNodes.forEach((node) => {
      const tex = node.getAttribute('data-tex') || '';
      const displayMode = node.getAttribute('data-display') === 'true';
      try {
        katex.render(tex, node as HTMLElement, {
          displayMode,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX error:', err);
      }
    });
  }, [content]);

  // Primitive parser converting simple markdown code blocks and LaTeX math notation
  const renderFormattedHTML = (rawText: string) => {
    let text = rawText;

    // Escape basic HTML
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks ```lang ... ```
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'javascript';
      return `<pre className="rounded-xl overflow-x-auto bg-slate-950 p-4 border border-slate-800 text-xs font-code my-3"><code class="language-${language}">${code.trim()}</code></pre>`;
    });

    // Display math $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      return `<div class="katex-render my-2 flex justify-center text-coral-400" data-tex="${math.trim()}" data-display="true"></div>`;
    });

    // Inline math $...$
    text = text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
      return `<span class="katex-render inline-block text-coral-400 px-1" data-tex="${math.trim()}" data-display="false"></span>`;
    });

    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Italic *text*
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>');

    // Line breaks
    text = text.replace(/\n/g, '<br/>');

    return { __html: text };
  };

  return (
    <div
      ref={containerRef}
      className={`prose prose-invert max-w-none text-slate-100 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={renderFormattedHTML(content)}
    />
  );
};
