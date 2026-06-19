import type { SupabaseClient, User } from "@supabase/supabase-js";

import type {
  AnonymousAuthProvider,
  AuthenticatedUser
} from "../useCases/resolveAnonymousCarrierUser";

export class SupabaseAnonymousAuthProvider implements AnonymousAuthProvider {
  constructor(private readonly client: SupabaseClient) {}

  async currentUser(): Promise<AuthenticatedUser | null> {
    const { data, error } = await this.client.auth.getSession();

    if (error) {
      throw new Error(`Supabase session lookup failed: ${error.message}`);
    }

    if (!data.session?.user) {
      return null;
    }

    return mapSupabaseUser(data.session.user);
  }

  async signInAnonymously(): Promise<AuthenticatedUser> {
    const { data, error } = await this.client.auth.signInAnonymously();

    if (error) {
      throw new Error(`Supabase anonymous sign-in failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Supabase anonymous sign-in returned no user.");
    }

    return mapSupabaseUser(data.user);
  }
}

function mapSupabaseUser(user: User): AuthenticatedUser {
  return {
    authUserId: user.id,
    isAnonymous: user.is_anonymous ?? user.app_metadata.provider === "anonymous"
  };
}
