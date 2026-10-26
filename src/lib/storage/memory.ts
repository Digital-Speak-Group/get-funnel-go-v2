import type { StorageProvider, StoredObject } from "./types";

/** In-process storage for tests and local experiments. Not shared between server instances. */
export class MemoryStorageProvider implements StorageProvider {
  private objects = new Map<string, StoredObject>();

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    this.objects.set(key, { body: new Uint8Array(body), contentType });
  }

  async get(key: string): Promise<StoredObject | null> {
    return this.objects.get(key) ?? null;
  }

  async remove(key: string): Promise<void> {
    this.objects.delete(key);
  }

  get size(): number {
    return this.objects.size;
  }
}
