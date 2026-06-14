import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import "react-native-url-polyfill/auto";

const supabaseUrl = "https://pierlunkmhowgcapthnb.supabase.co";
const supabasePublishableKey = "sb_publishable_FXfSFGRkkpIll7oAbDm-OQ_Bu58kpB8";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);