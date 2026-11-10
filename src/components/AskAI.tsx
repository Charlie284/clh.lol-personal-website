import { useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Sparkles, X } from "lucide-react";

export const askAIPrompt =
  "Read https://clh.lol/llms.txt and the linked public portfolio pages, then tell me about Charlie, the student developer behind clh.lol and https://github.com/Charlie284/. Summarize what he builds, his technical interests, and a project worth exploring. Link to your sources, distinguish work in progress from released software, and say when you cannot verify something. If you cannot access the sources, say so instead of guessing.";

const assistants = [
  {
    name: "ChatGPT",
    url: `https://chatgpt.com/?q=${encodeURIComponent(askAIPrompt)}`,
  },
  {
    name: "Claude",
    url: `https://claude.ai/new?q=${encodeURIComponent(askAIPrompt)}`,
  },
  {
    name: "Perplexity",
    url: `https://www.perplexity.ai/search?q=${encodeURIComponent(askAIPrompt)}`,
  },
];

export default function AskAI() {
  const id = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(askAIPrompt);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label="Ask AI about Charlie"
        onClick={() => setCopyState("idle")}
        className="fixed bottom-5 right-5 z-[110] flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505]/95 px-4 py-3 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors hover:border-white/20 hover:text-white md:right-24"
      >
        <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>Ask AI</span>
      </button>
      <section
        id={id}
        popover="auto"
        aria-labelledby={`${id}-title`}
        className="fixed bottom-20 left-auto right-5 top-auto m-0 max-h-[calc(100dvh-6.25rem)] w-[340px] max-w-[calc(100vw-2.5rem)] pointer-events-auto overflow-y-auto rounded-3xl border border-white/15 bg-[#070707] p-5 text-left text-white"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-title`} className="pt-2 text-lg font-semibold">
            Ask AI about me
          </h2>
          <button
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label="Close Ask AI"
            className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-white/65">
          Choose an assistant to ask about my work.
        </p>
        <ul aria-label="AI assistants" className="my-4 divide-y divide-white/10">
          {assistants.map(({ name, url }) => (
            <li key={name}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-4 rounded-md px-2 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span className="font-medium">{name}</span>
                <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-sm text-white/80 hover:bg-white/5 hover:text-white"
        >
          {copyState === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copyState === "copied" ? "Prompt copied" : "Copy the prompt"}
        </button>
        <p role="status" className="sr-only">
          {copyState === "copied" ? "Prompt copied to clipboard." : copyState === "manual" ? "Select and copy the prompt below." : ""}
        </p>
        {copyState === "manual" && (
          <label className="mt-3 block text-sm text-white/70">
            Copy this prompt manually:
            <textarea
              ref={promptRef}
              readOnly
              value={askAIPrompt}
              onFocus={() => promptRef.current?.select()}
              rows={5}
              className="mt-2 w-full rounded-lg border border-white/20 bg-black p-3 text-sm leading-relaxed text-white"
            />
          </label>
        )}
        <p className="mt-3 text-xs leading-relaxed text-white/60">
          Opens an external service. AI answers can be inaccurate.
        </p>
      </section>
    </>
  );
}
