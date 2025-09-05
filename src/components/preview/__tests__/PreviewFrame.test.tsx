import { test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import * as jsxTransformer from "@/lib/transform/jsx-transformer";

// Mock the file system context
vi.mock("@/lib/contexts/file-system-context");
const mockUseFileSystem = vi.mocked(useFileSystem);

// Mock the JSX transformer
vi.mock("@/lib/transform/jsx-transformer");
const mockCreateImportMap = vi.mocked(jsxTransformer.createImportMap);
const mockCreatePreviewHTML = vi.mocked(jsxTransformer.createPreviewHTML);

// Mock iframe element
const mockIframe = {
  setAttribute: vi.fn(),
  srcdoc: "",
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  
  // Default mock implementations
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    // Add other required methods
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  mockCreateImportMap.mockReturnValue({
    importMap: {},
    styles: "",
    errors: [],
  });

  mockCreatePreviewHTML.mockReturnValue("<html>preview</html>");

  // Mock ref callback
  vi.spyOn(require("react"), "useRef").mockReturnValue({
    current: mockIframe,
  });
});

test("shows welcome message on first load with no files", () => {
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  expect(screen.getByText("Welcome to UI Generator")).toBeInTheDocument();
  expect(screen.getByText("Start building React components with AI assistance")).toBeInTheDocument();
  expect(screen.getByText("Ask the AI to create your first component to see it live here")).toBeInTheDocument();
});

test("shows no preview message when no files exist after first load", async () => {
  // Start with files, then remove them
  const mockGetAllFiles = vi.fn();
  mockGetAllFiles.mockReturnValueOnce(new Map([["App.jsx", "content"]]));
  mockGetAllFiles.mockReturnValue(new Map());

  mockUseFileSystem.mockReturnValue({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: 1,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  const { rerender } = render(<PreviewFrame />);
  
  // Trigger re-render to simulate files being removed
  rerender(<PreviewFrame />);

  expect(screen.getByText("No Preview Available")).toBeInTheDocument();
});

test("finds and uses App.jsx as entry point", () => {
  const files = new Map([
    ["/App.jsx", "export default function App() { return <div>Hello</div>; }"],
    ["/other.jsx", "export default function Other() { return <div>Other</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  expect(mockCreateImportMap).toHaveBeenCalledWith(files);
  expect(mockCreatePreviewHTML).toHaveBeenCalledWith(
    "/App.jsx",
    {},
    "",
    []
  );
});

test("finds and uses App.tsx as entry point", () => {
  const files = new Map([
    ["/App.tsx", "export default function App() { return <div>Hello</div>; }"],
    ["/other.jsx", "export default function Other() { return <div>Other</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  expect(mockCreatePreviewHTML).toHaveBeenCalledWith(
    "/App.tsx",
    {},
    "",
    []
  );
});

test("falls back to index.jsx when App components not found", () => {
  const files = new Map([
    ["/index.jsx", "export default function Index() { return <div>Index</div>; }"],
    ["/other.jsx", "export default function Other() { return <div>Other</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  expect(mockCreatePreviewHTML).toHaveBeenCalledWith(
    "/index.jsx",
    {},
    "",
    []
  );
});

test("uses first JSX file when no standard entry points found", () => {
  const files = new Map([
    ["/random.jsx", "export default function Random() { return <div>Random</div>; }"],
    ["/another.tsx", "export default function Another() { return <div>Another</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  expect(mockCreatePreviewHTML).toHaveBeenCalledWith(
    "/random.jsx",
    {},
    "",
    []
  );
});

test("shows error when no JSX files found", () => {
  const files = new Map([
    ["/styles.css", "body { margin: 0; }"],
    ["/data.json", '{"name": "test"}'],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  // May have multiple "No Preview Available" elements due to component behavior
  expect(screen.getByText("No React component found. Create an App.jsx or index.jsx file to get started.")).toBeInTheDocument();
});

test("renders iframe with preview HTML", () => {
  const files = new Map([
    ["/App.jsx", "export default function App() { return <div>Hello</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  render(<PreviewFrame />);

  // The component should generate preview HTML and call createPreviewHTML
  expect(mockCreateImportMap).toHaveBeenCalledWith(files);
  expect(mockCreatePreviewHTML).toHaveBeenCalledWith(
    "/App.jsx",
    {},
    "",
    []
  );
  
  // Check that an iframe is rendered
  const iframe = document.querySelector('iframe');
  expect(iframe).toBeInTheDocument();
});

test("handles preview errors gracefully", () => {
  const files = new Map([
    ["/App.jsx", "export default function App() { return <div>Hello</div>; }"],
  ]);

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => files),
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  // Mock createImportMap to throw an error
  mockCreateImportMap.mockImplementation(() => {
    throw new Error("Transform error");
  });

  render(<PreviewFrame />);

  expect(screen.getAllByText("No Preview Available")).length.toBeGreaterThan(0);
  expect(screen.getByText("Transform error")).toBeInTheDocument();
});

test("clears error when files are added after error state", () => {
  const mockGetAllFiles = vi.fn();
  
  // Start with no files to show first-time welcome  
  mockGetAllFiles.mockReturnValue(new Map());

  mockUseFileSystem.mockReturnValue({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: 0,
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  const { rerender } = render(<PreviewFrame />);
  
  // Initially should show welcome
  expect(screen.getByText("Welcome to UI Generator")).toBeInTheDocument();

  // Now add files and change refreshTrigger
  mockGetAllFiles.mockReturnValue(new Map([
    ["/App.jsx", "export default function App() { return <div>Hello</div>; }"],
  ]));

  mockUseFileSystem.mockReturnValue({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: 1, // Changed trigger
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    listDirectory: vi.fn(),
    getNode: vi.fn(),
    rename: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    reset: vi.fn(),
  });

  rerender(<PreviewFrame />);

  // Should now render iframe instead of error
  expect(screen.queryByText("Welcome to UI Generator")).not.toBeInTheDocument();
  expect(mockCreatePreviewHTML).toHaveBeenCalled();
});