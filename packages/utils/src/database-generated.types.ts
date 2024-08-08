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
          {
            foreignKeyName: "public_Documents_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes_with_state"
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
      Invitations: {
        Row: {
          created_at: string
          email: string
          id: number
          modified_at: string | null
          name: string | null
          podcast: number
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          modified_at?: string | null
          name?: string | null
          podcast: number
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          modified_at?: string | null
          name?: string | null
          podcast?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invitations_podcast_fkey"
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
          private: boolean | null
          process: boolean
          published: boolean | null
          rssUrl: string | null
          slug: string
          title: string
          url: string | null
          uuid: string | null
        }
        Insert: {
          author?: string | null
          copyright?: string | null
          created_at?: string
          description?: string | null
          id?: number
          imageUrl?: string | null
          owner?: string | null
          private?: boolean | null
          process?: boolean
          published?: boolean | null
          rssUrl?: string | null
          slug: string
          title: string
          url?: string | null
          uuid?: string | null
        }
        Update: {
          author?: string | null
          copyright?: string | null
          created_at?: string
          description?: string | null
          id?: number
          imageUrl?: string | null
          owner?: string | null
          private?: boolean | null
          process?: boolean
          published?: boolean | null
          rssUrl?: string | null
          slug?: string
          title?: string
          url?: string | null
          uuid?: string | null
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
          {
            foreignKeyName: "SpeakerMap_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes_with_state"
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
          episode: number | null
          id: number
          podcast: number | null
          suggestion: string | null
        }
        Insert: {
          episode?: number | null
          id?: number
          podcast?: number | null
          suggestion?: string | null
        }
        Update: {
          episode?: number | null
          id?: number
          podcast?: number | null
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
          {
            foreignKeyName: "public_Suggestions_episode_fkey"
            columns: ["episode"]
            isOneToOne: false
            referencedRelation: "Episodes_with_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Suggestions_podcast_fkey"
            columns: ["podcast"]
            isOneToOne: false
            referencedRelation: "Podcasts"
            referencedColumns: ["id"]
          },
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
      Episodes_with_state: {
        Row: {
          audioUrl: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          error: Json | null
          guid: string | null
          id: number | null
          imageUrl: string | null
          modified_at: string | null
          originalAudioUrl: string | null
          podcast: number | null
          pubDate: string | null
          published: boolean | null
          rawTranscriptUrl: string | null
          slug: string | null
          state: string | null
          status: Json | null
          summaryUrl: string | null
          title: string | null
          transcriptUrl: string | null
          url: string | null
        }
        Insert: {
          audioUrl?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error?: Json | null
          guid?: string | null
          id?: number | null
          imageUrl?: string | null
          modified_at?: string | null
          originalAudioUrl?: string | null
          podcast?: number | null
          pubDate?: string | null
          published?: boolean | null
          rawTranscriptUrl?: string | null
          slug?: string | null
          state?: never
          status?: Json | null
          summaryUrl?: string | null
          title?: string | null
          transcriptUrl?: string | null
          url?: string | null
        }
        Update: {
          audioUrl?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error?: Json | null
          guid?: string | null
          id?: number | null
          imageUrl?: string | null
          modified_at?: string | null
          originalAudioUrl?: string | null
          podcast?: number | null
          pubDate?: string | null
          published?: boolean | null
          rawTranscriptUrl?: string | null
          slug?: string | null
          state?: never
          status?: Json | null
          summaryUrl?: string | null
          title?: string | null
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
    }
    Functions: {
      all_podcasts: {
        Args: {
          limit: number
          isPrivate: boolean
          isPublished: boolean
        }
        Returns: {
          id: number
          title: string
          description: string
          slug: string
          private: boolean
          published: boolean
          imageUrl: string
          newestEpisode: string
        }[]
      }
      assign_podcast_owner: {
        Args: {
          id: number
          owner: string
          activation_code: string
        }
        Returns: undefined
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
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
      episode_search: {
        Args: {
          query: string
          podcast_slug: string
          match_count: number
        }
        Returns: {
          id: number
          title: string
          description: string
          slug: string
          podcast: number
          imageUrl: string
        }[]
      }
      episode_state: {
        Args: {
          status: Json
        }
        Returns: string
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
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
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
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
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
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      latest_episodes: {
        Args: {
          limit: number
        }
        Returns: {
          id: number
          title: string
          description: string
          slug: string
          imageUrl: string
          pubDate: string
          podcastSlug: string
          podcastTitle: string
          podcastImageUrl: string
        }[]
      }
      pgroonga_command:
        | {
            Args: {
              groongacommand: string
            }
            Returns: string
          }
        | {
            Args: {
              groongacommand: string
              arguments: string[]
            }
            Returns: string
          }
      pgroonga_command_escape_value: {
        Args: {
          value: string
        }
        Returns: string
      }
      pgroonga_equal_query_text_array: {
        Args: {
          targets: string[]
          query: string
        }
        Returns: boolean
      }
      pgroonga_equal_query_varchar_array: {
        Args: {
          targets: string[]
          query: string
        }
        Returns: boolean
      }
      pgroonga_equal_text: {
        Args: {
          target: string
          other: string
        }
        Returns: boolean
      }
      pgroonga_equal_text_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_equal_varchar: {
        Args: {
          target: string
          other: string
        }
        Returns: boolean
      }
      pgroonga_equal_varchar_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_escape:
        | {
            Args: {
              value: boolean
            }
            Returns: string
          }
        | {
            Args: {
              value: number
            }
            Returns: string
          }
        | {
            Args: {
              value: number
            }
            Returns: string
          }
        | {
            Args: {
              value: number
            }
            Returns: string
          }
        | {
            Args: {
              value: number
            }
            Returns: string
          }
        | {
            Args: {
              value: number
            }
            Returns: string
          }
        | {
            Args: {
              value: string
            }
            Returns: string
          }
        | {
            Args: {
              value: string
            }
            Returns: string
          }
        | {
            Args: {
              value: string
            }
            Returns: string
          }
        | {
            Args: {
              value: string
              special_characters: string
            }
            Returns: string
          }
      pgroonga_flush: {
        Args: {
          indexname: unknown
        }
        Returns: boolean
      }
      pgroonga_handler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      pgroonga_highlight_html:
        | {
            Args: {
              target: string
              keywords: string[]
            }
            Returns: string
          }
        | {
            Args: {
              target: string
              keywords: string[]
              indexname: unknown
            }
            Returns: string
          }
        | {
            Args: {
              targets: string[]
              keywords: string[]
            }
            Returns: string[]
          }
        | {
            Args: {
              targets: string[]
              keywords: string[]
              indexname: unknown
            }
            Returns: string[]
          }
      pgroonga_index_column_name:
        | {
            Args: {
              indexname: unknown
              columnindex: number
            }
            Returns: string
          }
        | {
            Args: {
              indexname: unknown
              columnname: string
            }
            Returns: string
          }
      pgroonga_is_writable: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      pgroonga_match_positions_byte:
        | {
            Args: {
              target: string
              keywords: string[]
            }
            Returns: number[]
          }
        | {
            Args: {
              target: string
              keywords: string[]
              indexname: unknown
            }
            Returns: number[]
          }
      pgroonga_match_positions_character:
        | {
            Args: {
              target: string
              keywords: string[]
            }
            Returns: number[]
          }
        | {
            Args: {
              target: string
              keywords: string[]
              indexname: unknown
            }
            Returns: number[]
          }
      pgroonga_match_term:
        | {
            Args: {
              target: string[]
              term: string
            }
            Returns: boolean
          }
        | {
            Args: {
              target: string[]
              term: string
            }
            Returns: boolean
          }
        | {
            Args: {
              target: string
              term: string
            }
            Returns: boolean
          }
        | {
            Args: {
              target: string
              term: string
            }
            Returns: boolean
          }
      pgroonga_match_text_array_condition: {
        Args: {
          target: string[]
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_match_text_array_condition_with_scorers: {
        Args: {
          target: string[]
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_match_text_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_match_text_condition_with_scorers: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_match_varchar_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_match_varchar_condition_with_scorers: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_normalize:
        | {
            Args: {
              target: string
            }
            Returns: string
          }
        | {
            Args: {
              target: string
              normalizername: string
            }
            Returns: string
          }
      pgroonga_prefix_varchar_condition: {
        Args: {
          target: string
          conditoin: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_query_escape: {
        Args: {
          query: string
        }
        Returns: string
      }
      pgroonga_query_expand: {
        Args: {
          tablename: unknown
          termcolumnname: string
          synonymscolumnname: string
          query: string
        }
        Returns: string
      }
      pgroonga_query_extract_keywords: {
        Args: {
          query: string
          index_name?: string
        }
        Returns: string[]
      }
      pgroonga_query_text_array_condition: {
        Args: {
          targets: string[]
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_query_text_array_condition_with_scorers: {
        Args: {
          targets: string[]
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_query_text_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_query_text_condition_with_scorers: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_query_varchar_condition: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition"]
        }
        Returns: boolean
      }
      pgroonga_query_varchar_condition_with_scorers: {
        Args: {
          target: string
          condition: Database["public"]["CompositeTypes"]["pgroonga_full_text_search_condition_with_scorers"]
        }
        Returns: boolean
      }
      pgroonga_result_to_jsonb_objects: {
        Args: {
          result: Json
        }
        Returns: Json
      }
      pgroonga_result_to_recordset: {
        Args: {
          result: Json
        }
        Returns: Record<string, unknown>[]
      }
      pgroonga_score:
        | {
            Args: {
              row: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              tableoid: unknown
              ctid: unknown
            }
            Returns: number
          }
      pgroonga_set_writable: {
        Args: {
          newwritable: boolean
        }
        Returns: boolean
      }
      pgroonga_snippet_html: {
        Args: {
          target: string
          keywords: string[]
          width?: number
        }
        Returns: string[]
      }
      pgroonga_table_name: {
        Args: {
          indexname: unknown
        }
        Returns: string
      }
      pgroonga_tokenize: {
        Args: {
          target: string
        }
        Returns: Json[]
      }
      pgroonga_vacuum: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      pgroonga_wal_apply:
        | {
            Args: Record<PropertyKey, never>
            Returns: number
          }
        | {
            Args: {
              indexname: unknown
            }
            Returns: number
          }
      pgroonga_wal_set_applied_position:
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean
          }
        | {
            Args: {
              block: number
              offset: number
            }
            Returns: boolean
          }
        | {
            Args: {
              indexname: unknown
            }
            Returns: boolean
          }
        | {
            Args: {
              indexname: unknown
              block: number
              offset: number
            }
            Returns: boolean
          }
      pgroonga_wal_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          oid: unknown
          current_block: number
          current_offset: number
          current_size: number
          last_block: number
          last_offset: number
          last_size: number
        }[]
      }
      pgroonga_wal_truncate:
        | {
            Args: Record<PropertyKey, never>
            Returns: number
          }
        | {
            Args: {
              indexname: unknown
            }
            Returns: number
          }
      podcast_search: {
        Args: {
          query: string
          match_count: number
        }
        Returns: {
          id: number
          title: string
          description: string
          slug: string
          imageUrl: string
        }[]
      }
      podcast_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          title: string
          description: string
          slug: string
          imageUrl: string
          owner: string
          newest: string
          newestprocessed: string
          allepisodes: number
          processed: number
          inprogress: number
          errors: number
          process: boolean
          private: boolean
          uuid: string
        }[]
      }
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
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
      pgroonga_full_text_search_condition: {
        query: string | null
        weigths: number[] | null
        indexname: string | null
      }
      pgroonga_full_text_search_condition_with_scorers: {
        query: string | null
        weigths: number[] | null
        scorers: string[] | null
        indexname: string | null
      }
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
