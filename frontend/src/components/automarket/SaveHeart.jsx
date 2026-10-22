import React from 'react';
import { Heart } from 'lucide-react';

// The Save icon on ads: a dark outline heart whose outline turns red when the pointer is over it (put "group" on the button
// around it), no fill; and a solid red heart once the ad is saved.
export default function SaveHeart({ saved = false, className = 'w-6 h-6' }) {
  return (
    <Heart
      aria-hidden="true"
      strokeWidth={1.75}
      className={`${className} transition-colors ${saved ? 'text-red-500 fill-red-500' : 'text-foreground group-hover:text-red-500'}`} />
  );
}
