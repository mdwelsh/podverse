"use server"

import supabase from "./supabase"
import { Episode, Podcast } from "podverse-types";

// An Episode where the podcast field is replaced with the Podcast object itself.
type EpisodeWithPodcast = Omit<Episode, 'podcast'> & { podcast: Podcast };

export async function getPodcasts(): Promise<Podcast[]> {
  const { data, error } = await supabase.from("Podcasts").select("*");
  if (error) {
    console.log("error", error)
    throw error
  }
  return data
}

export async function getEpisodesWithPodcast(): Promise<EpisodeWithPodcast[]> {
  const { data, error } = await supabase.from('Episodes').select("*, podcast (*)");
  if (error) {
    console.log("error", error)
    throw error
  }
  return data
}
