import { createClient } from '@supabase/supabase-js';

export default createClient(
  //process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  //process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,

  // We need to use the non-anonymous key to allow writes by the process API endpoints.
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_API_KEY as string
);
