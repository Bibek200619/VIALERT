import type { CityData, EmergencyRecord, EmergencyRequest, Road, Signal } from '../../services/apiClient';

export type { CityData, EmergencyRecord, EmergencyRequest, Road, Signal };

export interface RoutePlan {
  nodeIds: string[];
  roadIds: string[];
  totalDistanceMeters: number;
  etaSeconds: number;
}

export type JourneyStatus = 'ready' | 'active' | 'paused' | 'completed';

export interface JourneyState {
  status: JourneyStatus;
  distanceTravelledMeters: number;
  elapsedSeconds: number;
}

export interface RoutePosition {
  lat: number;
  lng: number;
  segmentIndex: number;
  currentNodeId: string;
  currentRoadName: string;
}

export interface UpcomingSignal {
  signal: Signal;
  name: string;
  distanceMeters: number;
}

export interface TurnGuidance {
  direction: 'left' | 'right' | 'straight' | 'arrive';
  roadName: string;
  targetName: string;
  distanceMeters: number;
  secondsToTurn: number;
  segmentIndex: number;
}

export type CitySource = 'service' | 'demo-fallback';
