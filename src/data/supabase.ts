import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.suprl as string | undefined;
const anonKey = import.meta.env.sup as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
