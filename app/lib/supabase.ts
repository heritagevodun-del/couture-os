import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// On utilise createBrowserClient pour la gestion automatique des cookies (Auth V2)
// Cela permet de synchroniser la session entre le Client (React) et le Serveur (Next.js)
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
