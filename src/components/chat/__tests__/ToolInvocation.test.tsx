import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation } from "../ToolInvocation";

afterEach(() => {
  cleanup();
});

// Test data helpers
const createToolInvocation = (
  toolName: string,
  args: any = {},
  state: string = "result",
  result: any = "Success"
) => ({
  toolCallId: "test-id",
  toolName,
  args,
  state,
  result,
});

// str_replace_editor tool tests
test("ToolInvocation shows 'Creating' message for str_replace_editor create command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  });

  const { container } = render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // Check for success dot by class
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolInvocation shows 'Editing' message for str_replace_editor str_replace command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "str_replace",
    path: "/components/Button.tsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("ToolInvocation shows 'Adding to' message for str_replace_editor insert command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "insert",
    path: "/src/utils/helpers.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Adding to helpers.js")).toBeDefined();
});

test("ToolInvocation shows 'Reading' message for str_replace_editor view command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "view",
    path: "/README.md",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Reading README.md")).toBeDefined();
});

test("ToolInvocation shows 'Reverting' message for str_replace_editor undo_edit command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "undo_edit",
    path: "/index.html",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Reverting index.html")).toBeDefined();
});

// file_manager tool tests
test("ToolInvocation shows rename message for file_manager rename command", () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "rename",
    path: "/Card.jsx",
    new_path: "/CardComponent.jsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming Card.jsx to CardComponent.jsx")).toBeDefined();
});

test("ToolInvocation shows delete message for file_manager delete command", () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "delete",
    path: "/old/deprecated.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting deprecated.js")).toBeDefined();
});

// Loading state tests
test("ToolInvocation shows loading spinner when not completed", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  }, "calling", undefined);

  const { container } = render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // Check for loading spinner
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  // No success indicator
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocation shows success indicator when completed", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  }, "result", "Success");

  const { container } = render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // Check for success indicator
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  // No loading spinner
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// Edge cases and fallbacks
test("ToolInvocation handles missing file path gracefully", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file")).toBeDefined();
});

test("ToolInvocation handles missing args gracefully", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {}, "result", "Success");

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Processing file")).toBeDefined();
});

test("ToolInvocation handles unknown str_replace_editor command", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "unknown_command",
    path: "/test.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Working on test.js")).toBeDefined();
});

test("ToolInvocation handles unknown file_manager command", () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "unknown_command",
    path: "/test.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Managing test.js")).toBeDefined();
});

test("ToolInvocation handles completely unknown tool", () => {
  const toolInvocation = createToolInvocation("unknown_tool", {
    path: "/test.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Unknown Tool - test.js")).toBeDefined();
});

test("ToolInvocation formats tool names nicely for unknown tools", () => {
  const toolInvocation = createToolInvocation("my_custom_editor_tool", {
    path: "/test.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("My Custom Editor Tool - test.js")).toBeDefined();
});

// File path extraction tests
test("ToolInvocation extracts filename from root path", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolInvocation extracts filename from nested path", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/src/components/ui/Button.tsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocation handles path without leading slash", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "components/Card.jsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("ToolInvocation handles empty path", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file")).toBeDefined();
});

// Rename-specific tests
test("ToolInvocation handles rename with missing new_path", () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "rename",
    path: "/old.js",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming old.js")).toBeDefined();
});

test("ToolInvocation handles complex rename paths", () => {
  const toolInvocation = createToolInvocation("file_manager", {
    command: "rename",
    path: "/src/components/old/Button.tsx",
    new_path: "/src/components/ui/NewButton.tsx",
  });

  render(<ToolInvocation toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming Button.tsx to NewButton.tsx")).toBeDefined();
});

// Visual styling tests
test("ToolInvocation applies correct CSS classes", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  });

  const { container } = render(<ToolInvocation toolInvocation={toolInvocation} />);
  const element = container.firstChild as HTMLElement;

  expect(element.className).toContain("inline-flex");
  expect(element.className).toContain("items-center");
  expect(element.className).toContain("gap-2");
  expect(element.className).toContain("bg-neutral-50");
  expect(element.className).toContain("rounded-lg");
  expect(element.className).toContain("text-xs");
  expect(element.className).toContain("font-mono");
});

test("ToolInvocation text has correct styling", () => {
  const toolInvocation = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  });

  const { container } = render(<ToolInvocation toolInvocation={toolInvocation} />);
  const textElement = screen.getByText("Creating App.jsx");

  expect(textElement.className).toContain("text-neutral-700");
});