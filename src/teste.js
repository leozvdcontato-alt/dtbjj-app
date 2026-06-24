import { supabase } from "./lib/supabase";

async function testar() {

  const { data, error } =
    await supabase
      .from("turmas")
      .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);
}

testar();