export interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  caseSensitive?: boolean;
  context?: string; // Optional context or notes for the user
  timestamp: number;
}
