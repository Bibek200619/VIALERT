export type IconName = 'ambulance' | 'control' | 'simulation' | 'arrow' | 'location' | 'check' | 'layers' | 'dashboard' | 'map' | 'signal' | 'incident' | 'prediction' | 'settings' | 'search' | 'clock' | 'speed' | 'hospital' | 'route' | 'menu';

const paths: Record<IconName, React.ReactNode> = {
  ambulance: <><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7M6 10h5M8.5 7.5v5" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></>,
  control: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  simulation: <><path d="m9 7 8 5-8 5V7Z" /><circle cx="12" cy="12" r="9" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  layers: <><path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  map: <><path d="m9 4 6-2 6 2v16l-6 2-6-2-6 2V4l6-2Z" /><path d="M9 4v16M15 2v18" /></>,
  signal: <><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /><path d="M12 7v3M12 14v3" /></>,
  incident: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  prediction: <><path d="M4 19V5m0 14h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
  settings: <><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3l-.1-.1A1.8 1.8 0 0 1 7.2 2.8l.1.1a1.8 1.8 0 0 0 3-1.3v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  speed: <><path d="M4 16a8 8 0 1 1 16 0" /><path d="m12 12 4-4M7 18h10" /></>,
  hospital: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20" /><path d="M10 7h4m-2-2v4M8 14h8v7H8z" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h1" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
