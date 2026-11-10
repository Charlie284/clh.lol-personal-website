import { fireEvent, render, screen } from "@testing-library/react";
import { lazy } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppContent, type AppPageComponents } from "./App";

const Page = ({ title }: { title: string }) => <h1>{title}</h1>;

const pages: AppPageComponents = {
  Home: () => <Page title="Home" />,
  Projects: () => <Page title="Projects" />,
  BlogPage: () => <Page title="Blog" />,
  BlogPostPage: () => <Page title="Post" />,
  Privacy: () => <Page title="Privacy" />,
  NewsletterConfirmed: () => <Page title="Newsletter" />,
  NotFound: () => <Page title="Not found" />,
  Server: () => <Page title="Server" />,
  ThisWebsite: () => <Page title="Website" />,
  NewTrierBlock: () => <Page title="New Trier Block case study" />,
  Startle: () => <Page title="Startle case study" />,
};

describe("project routes", () => {
  it("renders the Startle case study at its own route", async () => {
    render(
      <MemoryRouter initialEntries={["/projects/startle"]}>
        <AppContent pages={pages} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Startle case study" }),
    ).toBeInTheDocument();
  });

  it("keeps navigation available after a failed import and recovers on another route", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const unavailableProjects = lazy(async () => {
      throw new TypeError("Failed to fetch dynamically imported module");
    });
    try {
      render(
        <MemoryRouter initialEntries={["/projects"]}>
          <AppContent pages={{ ...pages, Projects: unavailableProjects }} />
        </MemoryRouter>,
      );

      expect(await screen.findByRole("alert")).toHaveTextContent("This page couldn’t load.");
      expect(screen.getByRole("button", { name: "Reload page" })).toBeEnabled();
      fireEvent.click(screen.getByRole("link", { name: "Blog" }));
      expect(await screen.findByRole("heading", { name: "Blog" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
