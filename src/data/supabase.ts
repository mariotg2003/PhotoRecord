import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.suprl;
const anonKey = import.meta.env.sup;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
