import { test, expect, beforeEach, afterEach, vi } from "vitest";

// Mock server-only first
vi.mock("server-only", () => ({}));

// Mock Next.js cookies
const mockCookies = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookies),
}));

// Mock JOSE library to avoid crypto issues in test environment
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: vi.fn(),
}));

// Import after mocking
import { createSession } from "../auth";

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

test("createSession creates JWT token and sets cookie with correct options", async () => {
  const userId = "user123";
  const email = "test@example.com";

  await createSession(userId, email);

  expect(mockCookies.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      secure: false, // NODE_ENV is not production in tests
      sameSite: "lax",
      expires: expect.any(Date),
      path: "/",
    })
  );

  expect(mockCookies.set).toHaveBeenCalledTimes(1);
});

test("createSession sets secure cookie in production environment", async () => {
  process.env.NODE_ENV = "production";
  
  await createSession("user123", "test@example.com");

  const [, , options] = mockCookies.set.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("createSession sets cookie expiration to 7 days from now", async () => {
  const beforeCreate = Date.now();
  await createSession("user123", "test@example.com");
  const afterCreate = Date.now();

  const [, , options] = mockCookies.set.mock.calls[0];
  const expirationTime = options.expires.getTime();
  
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  // Cookie expiration should be ~7 days from creation time
  expect(expirationTime).toBeGreaterThan(beforeCreate + sevenDays - 1000); // Allow 1s tolerance
  expect(expirationTime).toBeLessThan(afterCreate + sevenDays + 1000);
});

test("createSession uses correct cookie name", async () => {
  await createSession("user123", "test@example.com");

  expect(mockCookies.set).toHaveBeenCalledWith(
    "auth-token",
    expect.any(String),
    expect.any(Object)
  );
});

test("createSession works with special characters in email", async () => {
  const userId = "special-user";
  const email = "test+special@example-domain.com";
  
  await createSession(userId, email);

  expect(mockCookies.set).toHaveBeenCalledTimes(1);
  expect(mockCookies.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.any(Object)
  );
});

test("createSession works without JWT_SECRET environment variable", async () => {
  delete process.env.JWT_SECRET;
  
  await expect(createSession("dev-user", "dev@example.com")).resolves.not.toThrow();
  
  expect(mockCookies.set).toHaveBeenCalledTimes(1);
});

test("createSession works with custom JWT_SECRET", async () => {
  process.env.JWT_SECRET = "custom-secret-key";
  
  await expect(createSession("custom-user", "custom@example.com")).resolves.not.toThrow();
  
  expect(mockCookies.set).toHaveBeenCalledTimes(1);
});

test("createSession sets all required cookie options", async () => {
  await createSession("user123", "test@example.com");

  const [cookieName, token, options] = mockCookies.set.mock.calls[0];

  expect(cookieName).toBe("auth-token");
  expect(token).toBe("mock-jwt-token");
  expect(options).toEqual(
    expect.objectContaining({
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: "lax",
      expires: expect.any(Date),
      path: "/",
    })
  );
});

test("createSession handles concurrent calls correctly", async () => {
  const sessions = [
    { userId: "user1", email: "user1@example.com" },
    { userId: "user2", email: "user2@example.com" },
    { userId: "user3", email: "user3@example.com" },
  ];
  
  // Create multiple sessions concurrently
  await Promise.all(sessions.map(({ userId, email }) => createSession(userId, email)));
  
  expect(mockCookies.set).toHaveBeenCalledTimes(3);
  
  // Verify each call had the same token (due to our mock)
  const calls = mockCookies.set.mock.calls;
  calls.forEach(([cookieName, token]) => {
    expect(cookieName).toBe("auth-token");
    expect(token).toBe("mock-jwt-token");
  });
});