import React, { useState } from 'react';

export default function Description({ description, sellerName }) {
  const [expanded, setExpanded] = useState(false);

  const processedDescription = description
    ? description.replace(/kumylife13/gi, sellerName || 'the seller')
    : '';

  const lines = processedDescription
    ? processedDescription.split('\n').map(l => l.trim()).filter(Boolean)
    : [];

  const previewCount = 5;
  const visible = expanded ? lines : lines.slice(0, previewCount);
  const hasMore = lines.length > previewCount;

  if (lines.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <h2 className="text-base font-bold text-foreground mb-4">Description</h2>
      <div className="flex flex-col gap-2.5">
        {visible.map((line, i) => (
          <p key={i} className={`text-sm ${!expanded && i >= previewCount - 1 ? 'text-muted-foreground/60' : 'text-foreground'}`}>
            {line}
          </p>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-sm font-bold text-foreground underline mt-4 hover:text-primary transition-colors"
        >
          {expanded ? 'Show Less' : 'Show more'}
        </button>
      )}
    </div>
  );
}