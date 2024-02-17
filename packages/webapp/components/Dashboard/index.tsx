import { auth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/supabase";
import { GetPodcasts } from "podverse-utils";

export async function Dashboard() {
    const { user } = auth();
    const supabase = await getSupabaseClient();
    const podcasts = await GetPodcasts(supabase);
  
    return (
      <div className="w-4/5 mx-auto mt-8">
        Dashboard
      </div>
    );
  }