import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Projects from "./Projects";
import NewTrierBlock from "./projects/NewTrierBlock";
import Startle from "./projects/Startle";
import Server from "./projects/Server";
import ThisWebsite from "./projects/ThisWebsite";

const caseStudies = [
  { Page: NewTrierBlock, path: "/projects/new-trier-block", title: "New Trier Block", returnLabel: "Back to projects", query: "?ref=portfolio&technology=Flutter", count: 1 },
  { Page: Startle, path: "/projects/startle", title: "Startle", returnLabel: "All projects", query: "?ref=portfolio&technology=Swift", count: 1 },
  { Page: Server, path: "/projects/server", title: "Homelab / Server", returnLabel: "Back to work", query: "?ref=portfolio&category=Infrastructure", count: 1 },
  { Page: ThisWebsite, path: "/projects/thiswebsite", title: "Personal Website", returnLabel: "All work", query: "?ref=portfolio&technology=React", count: 2 },
];

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname + location.search}</output>;
}

describe("Projects", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  function renderProjects() {
    return render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );
  }

  it("combines technology and status filters and can reset them", async () => {
    renderProjects();

    expect(screen.getByText("Showing 10 of 10")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Technology"), {
      target: { value: "React" },
    });
    expect(screen.getByText("Showing 2 of 10")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal Website" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connor’s Website" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "Complete" },
    });
    expect(screen.getByText("Showing 1 of 10")).toBeInTheDocument();
    // Exiting rows stay mounted during motion; CI can exceed RTL's 1s default.
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Personal Website" }),
      ).not.toBeInTheDocument(),
      { timeout: 5000 },
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Showing 10 of 10")).toBeInTheDocument();
  });

  it("filters projects by category", () => {
    renderProjects();

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "Archive" },
    });

    expect(screen.getByText("Showing 1 of 10")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PI-HTML" })).toBeInTheDocument();
  });

  it.each(caseStudies)("restores project filters through $title's return link", async ({ Page, path, title, returnLabel, query, count }) => {
    render(
      <MemoryRouter initialEntries={[`/projects${query}`]}>
        <Routes>
          <Route path="/projects" element={<Projects />} />
          <Route path={path} element={<Page />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByText(`Showing ${count} of 10`)).toBeInTheDocument();
    const projectLink = screen.getByRole("link", { name: new RegExp(title) });
    expect(projectLink).toHaveAttribute("href", path);
    fireEvent.click(projectLink);

    const returnLink = await screen.findByRole("link", { name: returnLabel });
    expect(returnLink).toHaveAttribute("href", `/projects${query}`);
    fireEvent.click(returnLink);

    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(`/projects${query}`);
    expect(screen.getByText(`Showing ${count} of 10`)).toBeInTheDocument();
  });

  it.each(caseStudies)("uses the project archive for a direct visit to $path", ({ Page, path, returnLabel }) => {
    render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    expect(screen.getByRole("link", { name: returnLabel })).toHaveAttribute("href", "/projects");
  });

  it.each(caseStudies)("ignores unrelated return destinations on $path", ({ Page, path, returnLabel }) => {
    render(
      <MemoryRouter initialEntries={[{ pathname: path, state: { projectsReturnTo: "https://example.com" } }]}>
        <Page />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: returnLabel })).toHaveAttribute("href", "/projects");
  });

  it.each(caseStudies)("restores retained filters after hydrating $path without a mismatch", ({ Page, path, returnLabel, query }) => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    const returnLink = within(container).getByRole("link", { name: returnLabel });
    expect(returnLink).toHaveAttribute("href", "/projects");
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      render(
        <MemoryRouter initialEntries={[{ pathname: path, state: { projectsReturnTo: `/projects${query}` } }]}>
          <Page />
        </MemoryRouter>,
        { container, hydrate: true, onRecoverableError },
      );

      expect(screen.getByRole("link", { name: returnLabel })).toBe(returnLink);
      expect(returnLink).toHaveAttribute("href", `/projects${query}`);
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
