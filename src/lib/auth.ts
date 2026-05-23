import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error.message);
    return;
  }

  router.replace("/auth/login");
}