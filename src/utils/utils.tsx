import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function secondsToIsoTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  parts.push(hrs.toString().padStart(2, "0"));
  parts.push(mins.toString().padStart(2, "0"));
  parts.push(secs.toString().padStart(2, "0"));
  return parts.join(":");
}

export type RootStackParamList = {
  HomeTabs: undefined;
  ActivityDetails: { activity_id: number };
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeTabs'>;

export type RouteKey = "activity" | "start";

export type Route = {
  key: RouteKey;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export type CoordinateArray = [number, number]