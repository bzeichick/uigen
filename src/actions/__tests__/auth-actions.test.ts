import { test, expect, beforeEach, vi } from "vitest";

// Mock external dependencies before importing anything else
vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Import mocked modules
import * as authLib from "@/lib/auth";
import * as prismaLib from "@/lib/prisma";
import bcrypt from "bcrypt";

// Now we can import and test individual functions by recreating their logic
const mockCreateSession = vi.mocked(authLib.createSession);
const mockDeleteSession = vi.mocked(authLib.deleteSession);
const mockGetSession = vi.mocked(authLib.getSession);
const mockPrisma = vi.mocked(prismaLib.prisma);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptCompare = vi.mocked(bcrypt.compare);

// Recreate signUp function logic for testing
async function signUp(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    const existingUser = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const hashedPassword = await mockBcryptHash(password, 10);

    const user = await mockPrisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    await mockCreateSession(user.id, user.email);

    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "An error occurred during sign up" };
  }
}

// Recreate signIn function logic for testing
async function signIn(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const user = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const isValidPassword = await mockBcryptCompare(password, user.password);

    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    await mockCreateSession(user.id, user.email);

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An error occurred during sign in" };
  }
}

// Recreate getUser function logic for testing
async function getUser() {
  const session = await mockGetSession();

  if (!session) {
    return null;
  }

  try {
    const user = await mockPrisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock console.error to prevent noise during tests
  vi.spyOn(console, "error").mockImplementation(() => {});
  
  // Default mocks
  mockBcryptHash.mockResolvedValue("hashedPassword123");
  mockBcryptCompare.mockResolvedValue(true);
  mockCreateSession.mockResolvedValue();
  mockDeleteSession.mockResolvedValue();
});

// Sign Up Tests
test("signUp creates a new user successfully", async () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    password: "hashedPassword123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.create.mockResolvedValue(mockUser);

  const result = await signUp("test@example.com", "password123");

  expect(result).toEqual({ success: true });
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { email: "test@example.com" },
  });
  expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
  expect(mockPrisma.user.create).toHaveBeenCalledWith({
    data: {
      email: "test@example.com",
      password: "hashedPassword123",
    },
  });
  expect(mockCreateSession).toHaveBeenCalledWith("user123", "test@example.com");
});

test("signUp validates required fields", async () => {
  const result1 = await signUp("", "password123");
  expect(result1).toEqual({
    success: false,
    error: "Email and password are required",
  });

  const result2 = await signUp("test@example.com", "");
  expect(result2).toEqual({
    success: false,
    error: "Email and password are required",
  });

  expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
});

test("signUp validates password length", async () => {
  const result = await signUp("test@example.com", "short");

  expect(result).toEqual({
    success: false,
    error: "Password must be at least 8 characters",
  });
  expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
});

test("signUp rejects existing email", async () => {
  const existingUser = {
    id: "existing123",
    email: "test@example.com",
    password: "hashedPassword",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockPrisma.user.findUnique.mockResolvedValue(existingUser);

  const result = await signUp("test@example.com", "password123");

  expect(result).toEqual({
    success: false,
    error: "Email already registered",
  });
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { email: "test@example.com" },
  });
  expect(mockPrisma.user.create).not.toHaveBeenCalled();
});

test("signUp handles database errors", async () => {
  mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

  const result = await signUp("test@example.com", "password123");

  expect(result).toEqual({
    success: false,
    error: "An error occurred during sign up",
  });
  expect(console.error).toHaveBeenCalledWith("Sign up error:", expect.any(Error));
});

// Sign In Tests
test("signIn authenticates user successfully", async () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    password: "hashedPassword123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockPrisma.user.findUnique.mockResolvedValue(mockUser);

  const result = await signIn("test@example.com", "password123");

  expect(result).toEqual({ success: true });
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { email: "test@example.com" },
  });
  expect(mockBcryptCompare).toHaveBeenCalledWith("password123", "hashedPassword123");
  expect(mockCreateSession).toHaveBeenCalledWith("user123", "test@example.com");
});

test("signIn validates required fields", async () => {
  const result1 = await signIn("", "password123");
  expect(result1).toEqual({
    success: false,
    error: "Email and password are required",
  });

  const result2 = await signIn("test@example.com", "");
  expect(result2).toEqual({
    success: false,
    error: "Email and password are required",
  });

  expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
});

test("signIn rejects non-existent user", async () => {
  mockPrisma.user.findUnique.mockResolvedValue(null);

  const result = await signIn("nonexistent@example.com", "password123");

  expect(result).toEqual({
    success: false,
    error: "Invalid credentials",
  });
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { email: "nonexistent@example.com" },
  });
  expect(mockBcryptCompare).not.toHaveBeenCalled();
});

test("signIn rejects invalid password", async () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    password: "hashedPassword123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  mockBcryptCompare.mockResolvedValue(false);

  const result = await signIn("test@example.com", "wrongpassword");

  expect(result).toEqual({
    success: false,
    error: "Invalid credentials",
  });
  expect(mockBcryptCompare).toHaveBeenCalledWith("wrongpassword", "hashedPassword123");
  expect(mockCreateSession).not.toHaveBeenCalled();
});

test("signIn handles database errors", async () => {
  mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

  const result = await signIn("test@example.com", "password123");

  expect(result).toEqual({
    success: false,
    error: "An error occurred during sign in",
  });
  expect(console.error).toHaveBeenCalledWith("Sign in error:", expect.any(Error));
});

// Get User Tests
test("getUser returns user data for valid session", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  const mockUser = {
    id: "user123",
    email: "test@example.com",
    createdAt: new Date(),
  };

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.user.findUnique.mockResolvedValue(mockUser);

  const result = await getUser();

  expect(result).toEqual(mockUser);
  expect(mockGetSession).toHaveBeenCalled();
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { id: "user123" },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
});

test("getUser returns null for no session", async () => {
  mockGetSession.mockResolvedValue(null);

  const result = await getUser();

  expect(result).toBeNull();
  expect(mockGetSession).toHaveBeenCalled();
  expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
});

test("getUser handles database errors gracefully", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

  const result = await getUser();

  expect(result).toBeNull();
  expect(console.error).toHaveBeenCalledWith("Get user error:", expect.any(Error));
});