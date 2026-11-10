import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Layout from "./Layout";

const failedImports = vi.hoisted(() => ({
  cursor: vi.fn(),
  dots: vi.fn(),
}));

vi.mock("./Cursor", () => {
  failedImports.cursor();
  throw new TypeError("Failed to fetch dynamically imported Cursor module");
});

vi.mock("./InteractiveDots", () => {
  failedImports.dots();
  throw new TypeError("Failed to fetch dynamically imported InteractiveDots module");
});

afterEach(() => vi.restoreAllMocks());

describe("optional visual effects", () => {
  it("keeps page content and navigation usable when both effect chunks fail to load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(pointer: fine)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    render(
      <MemoryRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<h1>Home content</h1>} />
            <Route path="/blog" element={<h1>Blog content</h1>} />
          </Routes>
        </Layout>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(failedImports.cursor).toHaveBeenCalled();
      expect(failedImports.dots).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole("heading", { name: "Home content" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Blog" }));
    expect(await screen.findByRole("heading", { name: "Blog content" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });
});
