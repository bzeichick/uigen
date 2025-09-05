import { test, expect, beforeEach, vi } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

beforeEach(() => {
  sessionStorageMock.clear();
  vi.clearAllMocks();
});

test("initially returns false for anonymous work", () => {
  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();
});

test("sets anonymous work with messages", () => {
  const messages = [{ role: "user", content: "Hello" }];
  const fileSystemData = { "/": { type: "directory", name: "/", path: "/" } };

  setHasAnonWork(messages, fileSystemData);

  expect(sessionStorageMock.setItem).toHaveBeenCalledWith("uigen_has_anon_work", "true");
  expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
    "uigen_anon_data",
    JSON.stringify({ messages, fileSystemData })
  );
  expect(getHasAnonWork()).toBe(true);
});

test("sets anonymous work with file system data", () => {
  const messages: any[] = [];
  const fileSystemData = {
    "/": { type: "directory", name: "/", path: "/" },
    "/test.txt": { type: "file", name: "test.txt", path: "/test.txt", content: "test" },
  };

  setHasAnonWork(messages, fileSystemData);

  expect(sessionStorageMock.setItem).toHaveBeenCalledWith("uigen_has_anon_work", "true");
  expect(getHasAnonWork()).toBe(true);
});

test("does not set anonymous work with empty data", () => {
  const messages: any[] = [];
  const fileSystemData = { "/": { type: "directory", name: "/", path: "/" } };

  setHasAnonWork(messages, fileSystemData);

  expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  expect(getHasAnonWork()).toBe(false);
});

test("does not set anonymous work with only root directory", () => {
  const messages: any[] = [];
  const fileSystemData = { "/": { type: "directory", name: "/", path: "/" } };

  setHasAnonWork(messages, fileSystemData);

  expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  expect(getHasAnonWork()).toBe(false);
});

test("retrieves anonymous work data", () => {
  const testData = {
    messages: [{ role: "user", content: "Test message" }],
    fileSystemData: {
      "/": { type: "directory", name: "/", path: "/" },
      "/test.txt": { type: "file", name: "test.txt", path: "/test.txt" },
    },
  };

  sessionStorageMock.setItem("uigen_anon_data", JSON.stringify(testData));

  const retrievedData = getAnonWorkData();
  expect(retrievedData).toEqual(testData);
});

test("returns null for invalid JSON data", () => {
  sessionStorageMock.setItem("uigen_anon_data", "invalid json");

  const retrievedData = getAnonWorkData();
  expect(retrievedData).toBeNull();
});

test("returns null when no data exists", () => {
  const retrievedData = getAnonWorkData();
  expect(retrievedData).toBeNull();
});

test("clears anonymous work", () => {
  // Set up some data first
  const messages = [{ role: "user", content: "Hello" }];
  const fileSystemData = {
    "/": { type: "directory", name: "/", path: "/" },
    "/test.txt": { type: "file", name: "test.txt", path: "/test.txt" },
  };

  setHasAnonWork(messages, fileSystemData);
  expect(getHasAnonWork()).toBe(true);

  // Clear the data
  clearAnonWork();

  expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("uigen_has_anon_work");
  expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("uigen_anon_data");
  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();
});

test("handles server-side rendering (no window)", () => {
  const originalWindow = global.window;
  
  // @ts-ignore
  delete global.window;

  expect(getHasAnonWork()).toBe(false);
  expect(getAnonWorkData()).toBeNull();

  // These should not throw
  setHasAnonWork([{ role: "user", content: "test" }], {});
  clearAnonWork();

  global.window = originalWindow;
});