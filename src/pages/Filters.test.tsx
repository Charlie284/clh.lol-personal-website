import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BlogPage from "./BlogPage";
import Projects from "./Projects";

describe("saved filters", () => {
  it.each([
    { Page: Projects, path: "/projects", query: "?technology=Flutter&status=In+progress", label: "Technology", value: "Flutter" },
    { Page: BlogPage, path: "/blog", query: "?q=tailscale&tag=networking&sort=oldest", label: "Search blog posts", value: "tailscale" },
  ])("hydrates $path with URL filters without replacing the prerendered page", ({ Page, path, query, label, value }) => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    const prerenderedFilter = within(container).getByLabelText(label);
    expect(prerenderedFilter).toBeDisabled();
    const onRecoverableError = vi.fn();

    render(<MemoryRouter initialEntries={[path + query]}><Page /></MemoryRouter>, {
      container,
      hydrate: true,
      onRecoverableError,
    });

    expect(screen.getByLabelText(label)).toHaveValue(value);
    expect(screen.getByLabelText(label)).toBe(prerenderedFilter);
    expect(screen.getByLabelText(label)).toBeEnabled();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("keeps blog menus unavailable in static HTML while article links and newsletter forms still work", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<MemoryRouter initialEntries={["/blog"]}><BlogPage /></MemoryRouter>);
    const archive = within(container);

    expect(archive.getByRole("button", { name: "Sort order: newest" })).toBeDisabled();
    expect(archive.getByRole("button", { name: "Filter by tag: All" })).toBeDisabled();
    expect(archive.getByRole("textbox", { name: "Email address" })).toBeEnabled();
    expect(archive.getByRole("button", { name: "Send me new posts" })).toBeEnabled();
    expect(archive.getAllByRole("link").length).toBeGreaterThan(1);
  });

  it("allows All as search text independently of the All tags option", () => {
    render(<MemoryRouter><BlogPage /></MemoryRouter>);
    const search = screen.getByRole("textbox", { name: "Search blog posts" });
    fireEvent.change(search, { target: { value: "All" } });
    expect(search).toHaveValue("All");
  });
});
