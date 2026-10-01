import { beforeAll, afterAll, vi } from "vitest";
import * as dotenv from "dotenv";

dotenv.config();
vi.mock("server-only", () => ({}));

beforeAll(() => {
  // Test setup - e.g., start test containers
});

afterAll(() => {
  // Test teardown
});