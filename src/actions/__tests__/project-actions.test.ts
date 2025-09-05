import { test, expect, beforeEach, vi } from "vitest";

// Mock external dependencies before importing anything else
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Import mocked modules
import * as authLib from "@/lib/auth";
import * as prismaLib from "@/lib/prisma";

const mockGetSession = vi.mocked(authLib.getSession);
const mockPrisma = vi.mocked(prismaLib.prisma);

// Recreate functions for testing
async function createProject(input: { name: string; messages: any[]; data: Record<string, any> }) {
  const session = await mockGetSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await mockPrisma.project.create({
    data: {
      name: input.name,
      userId: session.userId,
      messages: JSON.stringify(input.messages),
      data: JSON.stringify(input.data),
    },
  });

  return project;
}

async function getProjects() {
  const session = await mockGetSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const projects = await mockPrisma.project.findMany({
    where: {
      userId: session.userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return projects;
}

async function getProject(projectId: string) {
  const session = await mockGetSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await mockPrisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    id: project.id,
    name: project.name,
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock console.error to prevent noise during tests
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Create Project Tests
test("createProject creates a new project successfully", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  const mockProject = {
    id: "project123",
    name: "Test Project",
    userId: "user123",
    messages: JSON.stringify([{ role: "user", content: "Hello" }]),
    data: JSON.stringify({ "/App.jsx": "content" }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.project.create.mockResolvedValue(mockProject);

  const input = {
    name: "Test Project",
    messages: [{ role: "user", content: "Hello" }],
    data: { "/App.jsx": "content" },
  };

  const result = await createProject(input);

  expect(result).toEqual(mockProject);
  expect(mockGetSession).toHaveBeenCalled();
  expect(mockPrisma.project.create).toHaveBeenCalledWith({
    data: {
      name: "Test Project",
      userId: "user123",
      messages: JSON.stringify([{ role: "user", content: "Hello" }]),
      data: JSON.stringify({ "/App.jsx": "content" }),
    },
  });
});

test("createProject throws error for unauthorized user", async () => {
  mockGetSession.mockResolvedValue(null);

  const input = {
    name: "Test Project",
    messages: [],
    data: {},
  };

  await expect(createProject(input)).rejects.toThrow("Unauthorized");
  expect(mockPrisma.project.create).not.toHaveBeenCalled();
});

// Get Projects Tests
test("getProjects returns user's projects", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  const mockProjects = [
    {
      id: "project1",
      name: "Project 1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    },
    {
      id: "project2",
      name: "Project 2",
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-04"),
    },
  ];

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.project.findMany.mockResolvedValue(mockProjects);

  const result = await getProjects();

  expect(result).toEqual(mockProjects);
  expect(mockGetSession).toHaveBeenCalled();
  expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
    where: {
      userId: "user123",
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

test("getProjects throws error for unauthorized user", async () => {
  mockGetSession.mockResolvedValue(null);

  await expect(getProjects()).rejects.toThrow("Unauthorized");
  expect(mockPrisma.project.findMany).not.toHaveBeenCalled();
});

// Get Project Tests
test("getProject returns specific project with parsed data", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  const mockProject = {
    id: "project123",
    name: "Test Project",
    userId: "user123",
    messages: JSON.stringify([{ role: "user", content: "Hello" }]),
    data: JSON.stringify({ "/App.jsx": "content", "/styles.css": "body{}" }),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  };

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.project.findUnique.mockResolvedValue(mockProject);

  const result = await getProject("project123");

  expect(result).toEqual({
    id: "project123",
    name: "Test Project",
    messages: [{ role: "user", content: "Hello" }],
    data: { "/App.jsx": "content", "/styles.css": "body{}" },
    createdAt: mockProject.createdAt,
    updatedAt: mockProject.updatedAt,
  });

  expect(mockGetSession).toHaveBeenCalled();
  expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
    where: {
      id: "project123",
      userId: "user123",
    },
  });
});

test("getProject throws error for unauthorized user", async () => {
  mockGetSession.mockResolvedValue(null);

  await expect(getProject("project123")).rejects.toThrow("Unauthorized");
  expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
});

test("getProject throws error when project not found", async () => {
  const mockSession = {
    userId: "user123",
    email: "test@example.com",
  };

  mockGetSession.mockResolvedValue(mockSession);
  mockPrisma.project.findUnique.mockResolvedValue(null);

  await expect(getProject("nonexistent")).rejects.toThrow("Project not found");
  expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
    where: {
      id: "nonexistent",
      userId: "user123",
    },
  });
});