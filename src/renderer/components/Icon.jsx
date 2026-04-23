export default function Icon({ name, size = 14, color = 'currentColor', strokeWidth = 1.5 }) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const common = { width: size, height: size, viewBox: '0 0 20 20', style: { display: 'block', flexShrink: 0 } }
  switch (name) {
    case 'gear':     return <svg {...common}><path d="M8.30 2.39 L11.70 2.39 L11.95 4.11 L12.78 4.46 L14.18 3.41 L16.59 5.82 L15.54 7.22 L15.89 8.05 L17.61 8.30 L17.61 11.70 L15.89 11.95 L15.54 12.78 L16.59 14.18 L14.18 16.59 L12.78 15.54 L11.95 15.89 L11.70 17.61 L8.30 17.61 L8.05 15.89 L7.22 15.54 L5.82 16.59 L3.41 14.18 L4.46 12.78 L4.11 11.95 L2.39 11.70 L2.39 8.30 L4.11 8.05 L4.46 7.22 L3.41 5.82 L5.82 3.41 L7.22 4.46 L8.05 4.11 Z" {...p}/><circle cx="10" cy="10" r="2.4" {...p}/></svg>
    case 'plus':     return <svg {...common}><path d="M10 4v12M4 10h12" {...p}/></svg>
    case 'upload':   return <svg {...common}><path d="M10 3v10M6 7l4-4 4 4M4 15v2h12v-2" {...p}/></svg>
    case 'image':    return <svg {...common}><rect x="3" y="3" width="14" height="14" rx="1" {...p}/><circle cx="7.5" cy="7.5" r="1.2" {...p}/><path d="M3 14l4-4 4 4 3-3 3 3" {...p}/></svg>
    case 'trash':    return <svg {...common}><path d="M4 6h12M8 6V4h4v2m-6 0v10h8V6M8.5 9v5M11.5 9v5" {...p}/></svg>
    case 'star':     return <svg {...common}><path d="M10 3l2.2 4.5 4.8.7-3.5 3.4.8 4.9L10 14.2 5.7 16.5l.8-4.9L3 8.2l4.8-.7z" {...p}/></svg>
    case 'starFill': return <svg {...common}><path d="M10 3l2.2 4.5 4.8.7-3.5 3.4.8 4.9L10 14.2 5.7 16.5l.8-4.9L3 8.2l4.8-.7z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"/></svg>
    case 'arrow':    return <svg {...common}><path d="M10 4v12M4 10l6 6 6-6" {...p}/></svg>
    case 'back':     return <svg {...common}><path d="M12 4l-6 6 6 6" {...p}/></svg>
    case 'check':    return <svg {...common}><path d="M4 10l4 4 8-9" {...p}/></svg>
    case 'close':    return <svg {...common}><path d="M5 5l10 10M15 5L5 15" {...p}/></svg>
    case 'external': return <svg {...common}><path d="M11 4h5v5M16 4l-8 8M8 5H4v11h11v-4" {...p}/></svg>
    case 'copy':     return <svg {...common}><rect x="7" y="7" width="9" height="9" rx="1" {...p}/><path d="M4 13V4h9" {...p}/></svg>
    case 'desktop':  return <svg {...common}><rect x="2" y="4" width="16" height="11" rx="1" {...p}/><path d="M7 18h6M10 15v3" {...p}/></svg>
    case 'mobile':   return <svg {...common}><rect x="6" y="2" width="8" height="16" rx="1.5" {...p}/><path d="M9 15h2" {...p}/></svg>
    case 'chevron':  return <svg {...common}><path d="M6 8l4 4 4-4" {...p}/></svg>
    case 'camera':   return <svg {...common}><rect x="2" y="5" width="16" height="12" rx="1" {...p}/><circle cx="10" cy="11" r="3" {...p}/><path d="M7 5l1-2h4l1 2" {...p}/></svg>
    case 'cloud':    return <svg {...common}><path d="M6 14a3 3 0 010-6 4 4 0 017.7-1A3 3 0 0114 14H6z" {...p}/></svg>
    case 'dots':     return <svg {...common}><circle cx="5" cy="10" r="1" fill={color}/><circle cx="10" cy="10" r="1" fill={color}/><circle cx="15" cy="10" r="1" fill={color}/></svg>
    case 'github':   return <svg {...common}><path d="M10 2a8 8 0 00-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.1-.9-1.1-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.7-.2-3.5-.9-3.5-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 014 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3-1.8 3.7-3.5 3.9.3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4A8 8 0 0010 2z" fill={color}/></svg>
    case 'pencil':   return <svg {...common}><path d="M14 3l3 3-9.5 9.5L4 17l1.5-3.5L14 3z" {...p}/><path d="M12 5l3 3" {...p}/></svg>
    case 'grip':     return <svg {...common}><circle cx="7" cy="7"  r="1" fill={color}/><circle cx="13" cy="7"  r="1" fill={color}/><circle cx="7" cy="10" r="1" fill={color}/><circle cx="13" cy="10" r="1" fill={color}/><circle cx="7" cy="13" r="1" fill={color}/><circle cx="13" cy="13" r="1" fill={color}/></svg>
    default: return null
  }
}
