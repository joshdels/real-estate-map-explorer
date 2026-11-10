export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      app_datasets: {
        Row: { slug: string; payload: Json; updated_at: string };
        Insert: { slug: string; payload: Json; updated_at?: string };
        Update: { slug?: string; payload?: Json; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
