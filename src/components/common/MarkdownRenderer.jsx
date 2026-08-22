// MarkdownRenderer.jsx — Elegant Markdown Prose Formatter for VibeVenue
import React from 'react';
import './MarkdownRenderer.css';

/**
 * Lightweight, zero-dependency Markdown renderer that converts markdown
 * headers (#, ##, ###), bold (**text**), bullet points (- / *), numbered lists (1. ),
 * and linebreaks into clean, accessible JSX prose.
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let currentListType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (currentListType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="md-ol">
            {currentList.map((item, idx) => (
              <li key={idx} className="md-li">
                {parseInline(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="md-ul">
            {currentList.map((item, idx) => (
              <li key={idx} className="md-li">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  const parseInline = (text) => {
    if (!text) return null;
    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="md-strong">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Inline `code`
      const codeParts = part.split(/(`.*?`)/g);
      if (codeParts.length > 1) {
        return codeParts.map((cPart, ci) => {
          if (cPart.startsWith('`') && cPart.endsWith('`')) {
            return (
              <code key={ci} className="md-inline-code font-mono">
                {cPart.slice(1, -1)}
              </code>
            );
          }
          return cPart;
        });
      }
      return part;
    });
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${index}`} className="md-h3">
          {parseInline(line.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${index}`} className="md-h2">
          {parseInline(line.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h1-${index}`} className="md-h1">
          {parseInline(line.replace(/^#\s+/, ''))}
        </h2>
      );
      return;
    }

    // Unordered List (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentListType && currentListType !== 'ul') flushList();
      currentListType = 'ul';
      currentList.push(line.replace(/^[-*]\s+/, ''));
      return;
    }

    // Ordered List (1. 2. etc.)
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (currentListType && currentListType !== 'ol') flushList();
      currentListType = 'ol';
      currentList.push(olMatch[2]);
      return;
    }

    // Normal Paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="md-p">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`markdown-prose-container ${className}`}>{elements}</div>;
};

export default MarkdownRenderer;
