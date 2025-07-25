import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RunCoordinate } from "./TableInterfaces";

export function secondsToIsoTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(0);

  const parts = [];
  parts.push(hrs.toString().padStart(2, "0"));
  parts.push(mins.toString().padStart(2, "0"));
  parts.push(secs.toString().padStart(2, "0"));
  return parts.join(":");
}

export function straightLineDistance(
  point1: RunCoordinate,
  point2: RunCoordinate
): number {
  const R = eathRadiusAtLatitude((point1.lat + point2.lat)/2); // Raio da Terra em km
  const rad = Math.PI / 180;

  const dLat = (point2.lat - point1.lat) * rad;
  const dLon = (point2.lon - point1.lon) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * rad) *
      Math.cos(point2.lat * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c; // em quilômetros

  return distancia;
}
export function eathRadiusAtLatitude(latDegrees: number): number {
  const a = 6378137.0;      // raio equatorial em metros
  const b = 6356752.3142;   // raio polar em metros
  const latRad = latDegrees * Math.PI / 180;

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);

  const numerator = Math.pow((a * a * cosLat), 2) + Math.pow((b * b * sinLat), 2);
  const denominator = Math.pow(a * cosLat, 2) + Math.pow(b * sinLat, 2);

  return Math.sqrt(numerator / denominator)/1000; // retorna o raio em quilômetros
}

export function calculateDistanceWithAltitude(
  point1: RunCoordinate,
  point2: RunCoordinate
): number {
  //teorema de pitágoras
  const horizontalDistance = straightLineDistance(point1, point2);
  const verticalDistance = Math.abs(point2.alt - point1.alt)/1000; // converte para km

  return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
}

export function calculateTotalDistance(coordinates: RunCoordinate[]): number {
  if (coordinates.length < 2) {
    return 0;
  }
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistanceWithAltitude(
      coordinates[i],
      coordinates[i + 1]
    );
  }
  return totalDistance;
}

export function calculateMapBounds(coords: CoordinateArray[]):  { ne: CoordinateArray; sw: CoordinateArray } {
  if (coords.length === 0) {
    return {
      ne: [0, 0],
      sw: [0, 0],
    };
  }

  let minLon = coords[0][0];
  let maxLon = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];

  coords.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return {
    ne: [maxLon, maxLat] as [number, number], // top-right
    sw: [minLon, minLat] as [number, number], // bottom-left
  };
}

export type RootStackParamList = {
  HomeTabs: undefined;
  ActivityDetails: { activity_id: number };
};

export type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "HomeTabs"
>;

export type RouteKey = "activity" | "start";

export type Route = {
  key: RouteKey;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export type ActivityDetailsRouteParams = {
  ActivityDetails: {
    activity_id: number; 
  };
};


export type CoordinateArray = [number, number];
