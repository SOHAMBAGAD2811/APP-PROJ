import React from 'react';

/**
 * Lightweight, safe Markdown & aviation data token renderer.
 * Formats headers, bullet/ordered lists, tables, bold text, code tags,
 * and highlights flight numbers (e.g. AI-441, 6E-2041) and currency fares (₹6,425).
 */
function renderInline(text) {
  if (!text) return null;

  // Tokenize for:
  // 1. Bold: **...**
  // 2. Inline code: `...`
  // 3. Currency: ₹[0-9,]+ or INR [0-9,]+
  // 4. Flight code: [A-Z0-9]{2,3}[- ]\d{3,4}
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|₹\s?[\d,]+|INR\s?[\d,]+|\b[A-Z0-9]{2,3}[-]\d{3,4}\b)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {renderInline(inner)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85em',
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--accent-1)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (/^(₹|INR)/.test(part)) {
      return (
        <span
          key={idx}
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#15803d',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '0.88em',
            display: 'inline-block',
            margin: '0 2px',
            verticalAlign: 'baseline'
          }}
        >
          {part}
        </span>
      );
    }

    if (/^[A-Z0-9]{2,3}[-]\d{3,4}$/.test(part)) {
      return (
        <span
          key={idx}
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--accent-1)',
            background: 'var(--accent-light)',
            border: '1px solid #cde3ef',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '0.84em',
            display: 'inline-block',
            margin: '0 2px',
            verticalAlign: 'baseline'
          }}
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

export default function MarkdownContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Markdown Table detection (row starts and ends with |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const dataRows = tableLines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        elements.push(
          <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '10px 0' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              overflow: 'hidden',
              background: 'var(--bg-surface)'
            }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border)' }}>
                  {headerCols.map((col, idx) => (
                    <th key={idx} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {renderInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: rIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-base)'
                  }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} style={{ fontSize: '0.94rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--text-primary)' }}>
          {renderInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} style={{ fontSize: '1.02rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--text-primary)' }}>
          {renderInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} style={{ fontSize: '1.1rem', fontWeight: 800, margin: '18px 0 10px', color: 'var(--text-primary)' }}>
          {renderInline(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />);
      i++;
      continue;
    }

    // Bullet Lists
    if (/^(\*|-)\s+/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^(\*|-)\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^(\*|-)\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '6px 0 10px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: '1.55', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered Lists
    if (/^\d+\.\s+/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '6px 0 10px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: '1.55', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} style={{ margin: '6px 0', lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="chat-markdown">{elements}</div>;
}
