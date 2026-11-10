import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Home,
  Mail,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GithubIcon } from "./icons/GithubIcon";

type Command = {
  id: string;
  label: string;
  detail: string;
  keywords: string;
  icon: ElementType;
  action: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const open = () => {
    if (dialogRef.current) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : triggerRef.current;
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
    window.requestAnimationFrame(() => {
      const previous = previousFocusRef.current;
      const canRestore = previous?.isConnected &&
        !previous.closest("[inert], [hidden]") &&
        (!previous.checkVisibility || previous.checkVisibility());
      (canRestore ? previous : triggerRef.current)?.focus({ preventScroll: true });
    });
  };

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "home",
        label: "Home",
        detail: "Back to the start",
        keywords: "start intro about skills expertise",
        icon: Home,
        action: () => navigate("/"),
      },
      {
        id: "projects",
        label: "Projects",
        detail: "See what I have built",
        keywords: "work portfolio projects case studies",
        icon: Briefcase,
        action: () => navigate("/projects"),
      },
      {
        id: "blog",
        label: "Blog",
        detail: "Read what I have written",
        keywords: "writing notes linux posts mdx",
        icon: BookOpen,
        action: () => navigate("/blog"),
      },
      {
        id: "privacy",
        label: "Privacy and cookie choices",
        detail: "See what this site remembers",
        keywords: "privacy cookies consent allow decline settings",
        icon: ShieldCheck,
        action: () => navigate("/privacy"),
      },
      {
        id: "github",
        label: "GitHub",
        detail: "Open Charlie284 on GitHub",
        keywords: "code source repositories repo",
        icon: GithubIcon,
        action: () => window.open("https://github.com/Charlie284/", "_blank", "noopener,noreferrer"),
      },
      {
        id: "contact",
        label: "Email",
        detail: "Send me a message",
        keywords: "contact mail email collaborate",
        icon: Mail,
        action: () => {
          window.location.href = "mailto:Charlie@clh.lol";
        },
      },
    ],
    [navigate],
  );

  const visibleCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.detail} ${command.keywords}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      const isSlash = event.key === "/" && !isTypingTarget(event.target);

      if (isCommandK || isSlash) {
        event.preventDefault();
        open();
      }

      if (event.key === "Escape" && dialogRef.current) {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    document.querySelectorAll<HTMLElement>("[popover]").forEach((popover) => {
      popover.hidePopover?.();
    });
    inputRef.current?.focus();

    // Include portal content such as cookie notices as well as the app shell.
    const background: HTMLElement[] = [];
    let foreground = dialogRef.current?.parentElement;
    while (foreground?.parentElement) {
      background.push(...Array.from(foreground.parentElement.children).filter(
        (element): element is HTMLElement => element instanceof HTMLElement && element !== foreground,
      ));
      foreground = foreground.parentElement;
      if (foreground === document.body) break;
    }
    const previousAriaHidden = background.map((element) => element.getAttribute("aria-hidden"));
    const previousInert = background.map((element) => element.inert);
    const previousOverflow = document.body.style.overflow;

    background.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "hidden";

    return () => {
      background.forEach((element, index) => {
        element.inert = previousInert[index];
        const previous = previousAriaHidden[index];
        if (previous === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous);
      });
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: "nearest", behavior: "instant" });
  }, [isOpen, activeIndex, visibleCommands]);

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hidden);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const runCommand = (command: Command) => {
    command.action();
    close();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, visibleCommands.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = visibleCommands[activeIndex];
      if (command) runCommand(command);
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nextIndex = Math.min(
      Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0),
      visibleCommands.length - 1,
    );
    setActiveIndex(nextIndex);
    dialogRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[nextIndex]
      ?.focus({ preventScroll: true });
  };

  if (!isOpen) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className="fixed bottom-5 right-5 z-[110] hidden items-center gap-2 rounded-full border border-white/10 bg-[#050505]/95 px-4 py-3 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors hover:border-white/20 hover:text-white md:flex"
        aria-label="Open command palette"
      >
        <Search size={14} strokeWidth={1.8} />
        <span>/</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-md sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div ref={dialogRef} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050505] sm:max-h-[calc(100dvh-4rem)]">
        <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4">
          <Search size={18} className="text-white/55" strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search commands"
            aria-label="Search commands"
            aria-autocomplete="list"
            className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/55"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="command-list"
            aria-activedescendant={visibleCommands[activeIndex] ? `command-${visibleCommands[activeIndex].id}` : undefined}
          />
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close command palette"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div id="command-list" role="listbox" aria-label="Commands" className="min-h-0 max-h-[24rem] overflow-y-auto p-2">
          {visibleCommands.length > 0 ? (
            visibleCommands.map((command, index) => {
              const Icon = command.icon;
              const isActive = index === activeIndex;
              return (
                <button
                  key={command.id}
                  id={`command-${command.id}`}
                  type="button"
                  onClick={() => runCommand(command)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  aria-selected={isActive}
                  role="option"
                  className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                    isActive ? "border-white/50 bg-white/[0.12]" : "border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/55 group-hover:text-white">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold uppercase tracking-[0.18em] text-white">
                      {command.label}
                    </span>
                    <span className="mt-1 block text-sm text-white/55">{command.detail}</span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-white/55 transition-colors group-hover:text-white"
                    strokeWidth={1.8}
                  />
                </button>
              );
            })
          ) : (
            <div className="px-4 py-12 text-center text-sm text-white/55">
              Nothing here matches that search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
