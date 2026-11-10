import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./Layout";

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  vi.restoreAllMocks();
});

function FragmentPage({ ready }: { ready: boolean }) {
  return <MemoryRouter initialEntries={["/projects/startle#privacy"]}>
    <Layout><div data-route-ready={ready}><h1 id="privacy">Privacy</h1></div></Layout>
  </MemoryRouter>;
}

describe("fragment navigation", () => {
  it("scrolls to the initial fragment without resetting to the page top", () => {
    const resetScroll = vi.spyOn(window, "scrollTo");
    render(<FragmentPage ready />);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
    expect(resetScroll).not.toHaveBeenCalled();
  });

  it("waits for a lazy route to become ready before scrolling to its fragment", async () => {
    const view = render(<FragmentPage ready={false} />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    view.rerender(<FragmentPage ready />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
  });
});
