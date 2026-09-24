export type IconName = 'ambulance' | 'control' | 'simulation' | 'arrow' | 'location' | 'check' | 'layers';

const paths: Record<IconName, React.ReactNode> = {
  ambulance: <><path d="M3 6h11v12H3zM14 10h4l3 4v4h-7M6 10h5M8.5 7.5v5" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></>,
  control: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  simulation: <><path d="m9 7 8 5-8 5V7Z" /><circle cx="12" cy="12" r="9" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  layers: <><path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
