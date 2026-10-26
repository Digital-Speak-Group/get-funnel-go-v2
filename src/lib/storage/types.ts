/**
 * Storage provider interface — vendor-free.
 * V1 stores objects in a private Supabase Storage bucket; a VPS deployment can swap in
 * S3/MinIO or the filesystem without touching services or routes. Objects are never served
 * from the vendor directly: our own routes check access, then stream them (see
 * src/server/services/assets.ts).
 */

export interface StoredObject {
  body: Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  /** Writes (or overwrites) the object at `key`. */
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  /** The object at `key`, or null when it does not exist. */
  get(key: string): Promise<StoredObject | null>;
  /** Deletes the object at `key`; deleting a missing key is not an error. */
  remove(key: string): Promise<void>;
}
