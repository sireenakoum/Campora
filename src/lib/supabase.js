import { createClient } from '@supabase/supabase-js'

// You must have the ' ' marks around the URL and the Key!
const supabaseUrl = 'https://rupvcrpwokzvjutiootp.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_XfHAwLMhoHyXnyHKoQ65MA_NRs_QBdQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)