"use server";

import { cache } from 'react';
import supabase from "./supabase"
 
export const getPodcasts = cache(async () => {
  const { data, error } = await supabase.from("Podcasts").select("*");
  if (error) {
    console.log("error", error)
    throw error
  }
  return data
});

export const getEpisodesWithPodcast = cache(async () => {
  const { data, error } = await supabase.from('Episodes').select("*, podcast (*)");
  if (error) {
    console.log("error", error)
    throw error
  }
  return data
});

export const getLatestEpisodes = cache(async () => {
  const { data, error } = await supabase.from('Episodes').select("*, podcast ( slug, title )").order("pubDate", { ascending: false }).limit(8);
  if (error) {
    console.log("error", error)
    throw error
  }
  return data
});
