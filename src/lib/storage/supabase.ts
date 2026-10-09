import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { StorageProvider, StoredObject } from "./types";

/** Private bucket: nothing in it is reachable without going through our access-checked routes. */
export const ASSET_BUCKET = "slide-assets";

const isNotFound = (error: { message?: string } | null) => /not found/i.test(error?.message ?? "");

/**
 * Supabase Storage behind `StorageProvider`. Uses the service-role key, so it must stay
 * server-side; callers do the org/token access checks before reading or writing.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private bucketReady = false;

  constructor(
    private client: SupabaseClient,
    private bucket: string = ASSET_BUCKET
  ) {}

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.ensureBucket();
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, body, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed for ${key}: ${error.message}`);
  }

  async get(key: string): Promise<StoredObject | null> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error) {
      if (isNotFound(error)) return null;
      throw new Error(`Storage download failed for ${key}: ${error.message}`);
    }
    return {
      body: new Uint8Array(await data.arrayBuffer()),
      contentType: data.type || "application/octet-stream",
    };
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error && !isNotFound(error)) {
      throw new Error(`Storage delete failed for ${key}: ${error.message}`);
    }
  }

  /** Creates the private bucket on first write if the project does not have it yet. */
  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    const { error } = await this.client.storage.getBucket(this.bucket);
    if (error) {
      if (!isNotFound(error)) throw new Error(`Storage bucket check failed: ${error.message}`);
      const created = await this.client.storage.createBucket(this.bucket, { public: false });
      if (created.error && !/already exists/i.test(created.error.message)) {
        throw new Error(`Storage bucket creation failed: ${created.error.message}`);
      }
    }
    this.bucketReady = true;
  }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    provider = new SupabaseStorageProvider(client);
  }
  return provider;
}
