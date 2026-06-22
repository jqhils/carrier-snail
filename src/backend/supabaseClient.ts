import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createClient,
  processLock,
  type SupabaseClient
} from "@supabase/supabase-js";
import { AppState } from "react-native";
import "react-native-url-polyfill/auto";

export type CarrierSupabaseConfig = {
  anonKey: string;
  url: string;
};

export function readCarrierSupabaseConfig(): CarrierSupabaseConfig | null {
  // These MUST be direct `process.env.EXPO_PUBLIC_*` member accesses. Expo/Babel
  // statically inlines only that exact form into release bundles; reading them
  // through an alias (e.g. a parameter defaulting to process.env) silently
  // breaks inlining. It still works in dev — Metro injects process.env at
  // runtime — but resolves to undefined in a standalone build, dropping the app
  // into local-only mode. That was the Android prod "cloud sync not configured"
  // bug: the values were exported at bundle time but never substituted here.
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { anonKey, url };
}

export function createCarrierSupabaseClient(
  config: CarrierSupabaseConfig | null = readCarrierSupabaseConfig()
): SupabaseClient | null {
  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      persistSession: true,
      storage: AsyncStorage
    }
  });
}

export function installSupabaseAutoRefresh(client: SupabaseClient): () => void {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      client.auth.startAutoRefresh();
      return;
    }

    client.auth.stopAutoRefresh();
  });

  if (AppState.currentState === "active") {
    client.auth.startAutoRefresh();
  }

  return () => {
    subscription.remove();
    client.auth.stopAutoRefresh();
  };
}
