import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://bpoxaxwczezfhncntomq.supabase.co";

const supabaseKey =
  "sb_publishable_uFEHMHKZd6CIiZgrf1ip5A_0AF-FLYT";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );