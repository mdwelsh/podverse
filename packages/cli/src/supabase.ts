import { createClient } from '@supabase/supabase-js';

export default createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_API_KEY as string);
