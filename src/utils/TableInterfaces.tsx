export interface Run {
  id: number;
  name: string;
  difficulty: "easy" | "medium" | "hard" | null;
  duration: number;
  total_distance: number;
  created_at: string;
}
