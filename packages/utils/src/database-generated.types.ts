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
      Chunks: {
        Row: {
          content: string | null
          document: number
          embedding: string | null
          id: number
          meta: Json | null
        }
        Insert: {
          content?: string | null
          document: number
          embedding?: string | null
          id?: number
          meta?: Json | null
        }
        Update: {
          content?: string | null
          document?: number
          embedding?: string | null
          id?: number
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "public_Chunks_document_fkey"
            columns: ["document"]
            isOneToOne: false
            referencedRelation: "Documents"
            referencedColumns: ["id"]
          },
        ]
      }
      Documents: {
        Row: {
          checksum: string | null
          created_at: string | null
          episode: number | null
          id: number
          meta: Json | null
          source: string | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string | null
          episode?: number | null
          id?: number
          meta?: Json | null
          source?: string | null
        }
        Update: {
          checksum?: string | null
          created_at?: string | null
          episode?: number | null
          id?: number
          meta?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_Documents_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      Episodes: {
        Row: {
          audioUrl: string | null
          created_at: string
          description: string | null
          duration: number | null
          error: Json | null
          guid: string | null
          id: number
          imageUrl: string | null
          modified_at: string | null
          originalAudioUrl: string | null
          podcast: number
          pubDate: string | null
          published: boolean | null
          rawTranscriptUrl: string | null
          slug: string
          status: Json | null
          summaryUrl: string | null
          title: string
          transcriptUrl: string | null
          url: string | null
        }
        Insert: {
          audioUrl?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          error?: Json | null
          guid?: string | null
          id?: number
          imageUrl?: string | null
          modified_at?: string | null
          originalAudioUrl?: string | null
          podcast: number
          pubDate?: string | null
          published?: boolean | null
          rawTranscriptUrl?: string | null
          slug: string
          status?: Json | null
          summaryUrl?: string | null
          title: string
          transcriptUrl?: string | null
          url?: string | null
        }
        Update: {
          audioUrl?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          error?: Json | null
          guid?: string | null
          id?: number
          imageUrl?: string | null
          modified_at?: string | null
          originalAudioUrl?: string | null
          podcast?: number
          pubDate?: string | null
          published?: boolean | null
          rawTranscriptUrl?: string | null
          slug?: string
          status?: Json | null
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
          },
        ]
      }
      Podcasts: {
        Row: {
          author: string | null
          copyright: string | null
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
          author?: string | null
          copyright?: string | null
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
          author?: string | null
          copyright?: string | null
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
          },
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
          },
        ]
      }
      Subscriptions: {
        Row: {
          billingProviderId: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: number
          modified_at: string | null
          plan: string
          start_time: string | null
          state: string
          user: string
        }
        Insert: {
          billingProviderId?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: number
          modified_at?: string | null
          plan: string
          start_time?: string | null
          state: string
          user: string
        }
        Update: {
          billingProviderId?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: number
          modified_at?: string | null
          plan?: string
          start_time?: string | null
          state?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_Subscriptions_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
        ]
      }
      Suggestions: {
        Row: {
          episode: number
          id: number
          suggestion: string | null
        }
        Insert: {
          episode: number
          id?: number
          suggestion?: string | null
        }
        Update: {
          episode?: number
          id?: number
          suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_Suggestions_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      Users: {
        Row: {
          created_at: string
          displayName: string | null
          id: string
          plan: string | null
        }
        Insert: {
          created_at?: string
          displayName?: string | null
          id?: string
          plan?: string | null
        }
        Update: {
          created_at?: string
          displayName?: string | null
          id?: string
          plan?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      chunk_vector_search: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          document: number
          meta: Json
          content: string
          similarity: number
        }[]
      }
      chunk_vector_search_episode: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          episode_id: number
        }
        Returns: {
          id: number
          document: number
          meta: Json
          content: string
          similarity: number
        }[]
      }
      chunk_vector_search_podcast: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          podcast_id: number
        }
        Returns: {
          id: number
          document: number
          meta: Json
          content: string
          similarity: number
        }[]
      }
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
      is_podcast_owner: {
        Args: {
          episodeid: number
          userid: string
        }
        Returns: boolean
      }
      is_podcast_owner_with_podcast_id: {
        Args: {
          podcastId: number
          userid: string
        }
        Returns: boolean
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
