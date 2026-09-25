import { useEffect, useState } from 'react';
import { Icon, type IconName } from '../../../components/Icon';

const items: { href: string; label: string; icon: IconName }[] = [
  { href: '#traffic-dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '#traffic-map', label: 'Live map', icon: 'map' },
  { href: '#ambulance-list', label: 'Ambulances', icon: 'ambulance' },
  { href: '#traffic-signals', label: 'Signals', icon: 'signal' },
  { href: '#traffic-incidents', label: 'Incidents', icon: 'incident' },
  { href: '#traffic-predictions', label: 'Predictions', icon: 'prediction' },
  { href: '#traffic-settings', label: 'Settings', icon: 'settings' },
];

export function TrafficSidebar() {
  const [activeHref, setActiveHref] = useState('#traffic-dashboard');

  useEffect(() => {
    const updateActiveSection = () => setActiveHref(window.location.hash || '#traffic-dashboard');
    updateActiveSection();
    window.addEventListener('hashchange', updateActiveSection);
    return () => window.removeEventListener('hashchange', updateActiveSection);
  }, []);

  return <aside className="traffic-sidebar" aria-label="Traffic control navigation">
    <a className="traffic-brand" href="#traffic-dashboard" aria-label="VIALERT traffic dashboard">
      <span className="traffic-brand-mark" aria-hidden="true"><span>V</span><i>+</i></span>
      <span>VIALERT<small>Traffic control</small></span>
    </a>
    <nav className="traffic-sidebar-nav" aria-label="Traffic dashboard sections">
      {items.map((item) => <a key={item.href} href={item.href} className={`traffic-sidebar-link${activeHref === item.href ? ' active' : ''}`} aria-current={activeHref === item.href ? 'page' : undefined}>
        <Icon name={item.icon} /><span>{item.label}</span>
      </a>)}
    </nav>
    <div className="traffic-sidebar-footer">
      <span className="traffic-operator-avatar" aria-hidden="true">TP</span>
      <div><strong>Traffic In-charge</strong><small>Control room · demo</small></div>
    </div>
  </aside>;
}
