export interface Run {
  id: number;
  name: string;
  difficulty: "easy" | "medium" | "hard" | null;
  duration: number;
  total_distance: number;
  created_at: string;
}

export interface RunCoordinate {
  id: number;
  run_id: number;
  lat: number;
  lon: number;
  alt: number;
  speed: number;
  heading: number;
  created_at: string;
}
