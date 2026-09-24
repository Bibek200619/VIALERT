import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { AmbulanceDashboardPage } from '../pages/AmbulanceDashboardPage';
import { SimulationPage } from '../pages/SimulationPage';
import { TrafficControlPage } from '../pages/TrafficControlPage';

export function AppRoutes() {
  return <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/ambulance" replace />} />
      <Route path="ambulance" element={<AmbulanceDashboardPage />} />
      <Route path="traffic" element={<TrafficControlPage />} />
      <Route path="simulation" element={<SimulationPage />} />
      <Route path="*" element={<Navigate to="/ambulance" replace />} />
    </Route>
  </Routes>;
}
