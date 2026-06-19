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

export function readCarrierSupabaseConfig(
  env: NodeJS.ProcessEnv = process.env
): CarrierSupabaseConfig | null {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey =
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
