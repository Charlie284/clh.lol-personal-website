import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { renderToString } from "react-dom/server";
import Home from "./Home";

const motionPreference = vi.hoisted(() => ({ value: null as boolean | null }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...await importOriginal<typeof import("framer-motion")>(),
  useReducedMotion: () => motionPreference.value,
}));

describe("homepage hydration", () => {
  afterEach(() => { motionPreference.value = null; });

  it("retains the prerendered content when the browser requests reduced motion", () => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<MemoryRouter><Home /></MemoryRouter>);
    const prerenderedHeading = container.querySelector("h1");
    const onRecoverableError = vi.fn();

    motionPreference.value = true;
    render(<MemoryRouter><Home /></MemoryRouter>, { container, hydrate: true, onRecoverableError });

    expect(container.querySelector("h1")).toBe(prerenderedHeading);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

describe("Featured work", () => {
  beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0.999); });
  afterEach(() => { vi.restoreAllMocks(); });
  it("opens the centered project with one click", async () => {
    render(
      <MemoryRouter>
        <Home />
        <LocationProbe />
      </MemoryRouter>,
    );

    const project = await screen.findByRole("link", { name: "Open Startle case study" });
    expect(project).toHaveAttribute("href", "/projects/startle");
    fireEvent.click(project);

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(
        "/projects/startle",
      ),
    );
  });
  it("selects side previews before navigating and wraps with arrow controls", () => {
    render(<MemoryRouter><Home /><LocationProbe /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: "Select New Trier Block" }));
    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent("/");
    expect(screen.getByRole("link", { name: "Open New Trier Block case study" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Previous project" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous project" }));
    expect(screen.getByRole("link", { name: "Open Homelab / Server case study" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next project" }));
    expect(screen.getByRole("link", { name: "Open Startle case study" })).toBeInTheDocument();
  });

  it("supports keyboard selection and opens the selected destination", () => {
    render(<MemoryRouter><Home /><LocationProbe /></MemoryRouter>);
    const gallery = screen.getByRole("region", { name: "Featured projects" });
    screen.getByRole("link", { name: "Open Startle case study" }).focus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("link", { name: "Open New Trier Block case study" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("link", { name: "Open Pi Calc on GitHub" })).toHaveFocus();
    fireEvent.keyDown(gallery, { key: "End" });
    expect(screen.getByRole("link", { name: "Open Homelab / Server case study" })).toBeInTheDocument();
    fireEvent.keyDown(gallery, { key: "Home" });
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("link", { name: "Open New Trier Block case study" }));
    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent("/projects/new-trier-block");
  });

  it("centers the selected preview after the initial project shuffle", async () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const { container } = render(<MemoryRouter><Home /></MemoryRouter>);
    const selected = container.querySelector<HTMLElement>('.coverflow-card[data-active="true"]')!;
    await waitFor(() => {
      expect(selected.style.opacity).toBe("1");
      expect(selected.style.transform).toBe("none");
    });
  });

  it("chooses six unique projects, keeps them stable on rerender, and resamples on a new visit", () => {
    const view = render(<MemoryRouter><Home /></MemoryRouter>);
    const selection = () => Array.from(view.container.querySelectorAll(".coverflow-card"), (card) => card.getAttribute("href"));
    const first = selection();
    expect(first).toHaveLength(6);
    expect(new Set(first).size).toBe(6);
    vi.mocked(Math.random).mockReturnValue(0);
    view.rerender(<MemoryRouter><Home /></MemoryRouter>);
    expect(selection()).toEqual(first);
    view.unmount();
    const next = render(<MemoryRouter><Home /></MemoryRouter>);
    const second = Array.from(next.container.querySelectorAll(".coverflow-card"), (card) => card.getAttribute("href"));
    expect(second).toHaveLength(6);
    expect(new Set(second).size).toBe(6);
    expect(second).not.toEqual(first);
    expect(second).toContain("https://github.com/Charlie284/random-username-generator");
  });

  it("keeps offstage projects out of keyboard navigation and preserves external links", () => {
    const { container } = render(<MemoryRouter><Home /></MemoryRouter>);
    expect(container.querySelectorAll('.coverflow-card[tabindex="-1"]')).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Next project" }));
    fireEvent.click(screen.getByRole("button", { name: "Next project" }));
    const external = screen.getByRole("link", { name: "Open Pi Calc on GitHub" });
    expect(external).toHaveAttribute("href", "https://github.com/Charlie284/pi-calc");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

});

describe("Homepage contact", () => {
  it("links to Charlie's GitHub profile from the hero", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    const githubLink = screen.getByRole("link", {
      name: "Charlie284 on GitHub",
    });
    expect(githubLink).toHaveAttribute("href", "https://github.com/Charlie284/");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });

  it("does not repeat the GitHub profile callout below the homepage content", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", {
        name: /Most of my code lives on GitHub/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not repeat the contact callout on the homepage", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: "Want to talk?" }),
    ).not.toBeInTheDocument();
  });
});
