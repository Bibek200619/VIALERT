import rawVehicles from '../../../../shared-data/vehicles.json';
import type { VehicleFixture } from '../../services/apiClient';

export const demoVehicles: VehicleFixture[] = rawVehicles.map((vehicle) => ({
  ...vehicle,
  type: vehicle.type as VehicleFixture['type'],
  status: vehicle.status as VehicleFixture['status'],
  priority: vehicle.priority as VehicleFixture['priority'],
}));

export const vehicleFilterLabels = {
  all: 'All vehicles', ambulances: 'Ambulances', buses: 'Buses', active: 'Active only', critical: 'Critical', alerts: 'Alerts',
} as const;
