import { describe, it, expect } from "vitest";
import { resolveDatabaseSsl } from "@/lib/db/ssl";

const SSL = { rejectUnauthorized: false };

describe("resolveDatabaseSsl", () => {
  it("disables SSL for localhost by default", () => {
    expect(resolveDatabaseSsl("postgresql://u:p@localhost:5434/getfunnels")).toBe(false);
    expect(resolveDatabaseSsl("postgresql://u:p@127.0.0.1:5432/getfunnels")).toBe(false);
    expect(resolveDatabaseSsl("postgresql://localhost/getfunnels")).toBe(false);
  });

  it("enables SSL for remote hosts by default", () => {
    expect(resolveDatabaseSsl("postgresql://u:p@db.abc.supabase.co:5432/postgres")).toEqual(SSL);
    expect(resolveDatabaseSsl("postgresql://u:p@postgres:5432/getfunnels")).toEqual(SSL);
  });

  it("does not treat 'localhost' elsewhere in the URL as a local host", () => {
    expect(resolveDatabaseSsl("postgresql://localhost:p@db.example.com:5432/x")).toEqual(SSL);
  });

  it("lets the explicit flag override the default", () => {
    expect(resolveDatabaseSsl("postgresql://u:p@postgres:5432/getfunnels", false)).toBe(false);
    expect(resolveDatabaseSsl("postgresql://u:p@localhost:5432/getfunnels", true)).toEqual(SSL);
  });
});
