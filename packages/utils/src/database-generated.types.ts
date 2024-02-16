export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Episodes: {
        Row: {
          audioUrl: string | null
          created_at: string
          description: string | null
          error: Json | null
          guid: string | null
          id: number
          imageUrl: string | null
          modified_at: string | null
          podcast: number
          pubDate: string | null
          rawTranscriptUrl: string | null
          slug: string
          summaryUrl: string | null
          title: string
          transcriptUrl: string | null
          url: string | null
        }
        Insert: {
          audioUrl?: string | null
          created_at?: string
          description?: string | null
          error?: Json | null
          guid?: string | null
          id?: number
          imageUrl?: string | null
          modified_at?: string | null
          podcast: number
          pubDate?: string | null
          rawTranscriptUrl?: string | null
          slug: string
          summaryUrl?: string | null
          title: string
          transcriptUrl?: string | null
          url?: string | null
        }
        Update: {
          audioUrl?: string | null
          created_at?: string
          description?: string | null
          error?: Json | null
          guid?: string | null
          id?: number
          imageUrl?: string | null
          modified_at?: string | null
          podcast?: number
          pubDate?: string | null
          rawTranscriptUrl?: string | null
          slug?: string
          summaryUrl?: string | null
          title?: string
          transcriptUrl?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Episodes_podcast_fkey"
            columns: ["podcast"]
            isOneToOne: false
            referencedRelation: "Podcasts"
            referencedColumns: ["id"]
          }
        ]
      }
      nods_page: {
        Row: {
          checksum: string | null
          id: number
          meta: Json | null
          parent_page_id: number | null
          path: string
          source: string | null
          type: string | null
        }
        Insert: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path: string
          source?: string | null
          type?: string | null
        }
        Update: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          }
        ]
      }
      nods_page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          }
        ]
      }
      Podcasts: {
        Row: {
          created_at: string
          description: string | null
          id: number
          imageUrl: string | null
          owner: string | null
          rssUrl: string | null
          slug: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          imageUrl?: string | null
          owner?: string | null
          rssUrl?: string | null
          slug: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          imageUrl?: string | null
          owner?: string | null
          rssUrl?: string | null
          slug?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_Podcasts_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      SpeakerMap: {
        Row: {
          created_at: string
          episode: number
          id: number
          modified_at: string | null
          name: string | null
          speakerId: string
        }
        Insert: {
          created_at?: string
          episode: number
          id?: number
          modified_at?: string | null
          name?: string | null
          speakerId: string
        }
        Update: {
          created_at?: string
          episode?: number
          id?: number
          modified_at?: string | null
          name?: string | null
          speakerId?: string
        }
        Relationships: [
          {
            foreignKeyName: "SpeakerMap_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes"
            referencedColumns: ["id"]
          }
        ]
      }
      Users: {
        Row: {
          created_at: string
          displayName: string | null
          id: string
        }
        Insert: {
          created_at?: string
          displayName?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          displayName?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_page_parents: {
        Args: {
          page_id: number
        }
        Returns: {
          id: number
          parent_page_id: number
          path: string
          meta: Json
        }[]
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          page_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
