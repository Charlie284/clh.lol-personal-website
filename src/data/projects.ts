type Project = {
  href: string;
  img?: string;
  title: string;
  desc: string;
  badge: string;
  buttonText?: string;
  target?: string;
  technologies: string[];
  category: "App" | "Archive" | "Infrastructure" | "Tool" | "Website";
  status: "Active" | "Complete" | "In progress";
};

export const projectsList: Project[] = [
  {
    href: "/projects/new-trier-block",
    title: "New Trier Block",
    desc: "An iOS and Android app for New Trier students, parents, and teachers, with bell schedules, a current-period countdown, and personal class schedules.",
    badge: "Flutter / Dart",
    buttonText: "Read case study",
    technologies: ["Flutter", "Dart"],
    category: "App",
    status: "In progress",
  },
  {
    href: "/projects/startle",
    img: "/startle-app-icon.webp",
    title: "Startle",
    desc: "A macOS menu bar app I am building to schedule local videos. It has timing controls, safety checks, and no cloud account.",
    badge: "Swift / SwiftUI",
    buttonText: "Read case study",
    technologies: ["Swift", "SwiftUI"],
    category: "App",
    status: "In progress",
  },
  {
    href: "https://github.com/Charlie284/pi-calc",
    title: "Pi Calc",
    desc: "A Rust program that calculates pi with the Chudnovsky algorithm and GMP-backed arithmetic. I built it while learning Rust, then kept pushing it.",
    badge: "Rust / Systems",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["Rust"],
    category: "Tool",
    status: "Complete",
  },
  {
    href: "/projects/thiswebsite",
    img: "/website-screenshot.webp",
    title: "Personal Website",
    desc: "This website, built with React and TypeScript. It has an MDX blog, a command palette, and a lot of custom motion.",
    badge: "React / TypeScript",
    technologies: ["React", "TypeScript"],
    category: "Website",
    status: "In progress",
  },
  {
    href: "https://github.com/Charlie284/connors-website-react",
    title: "Connor’s Website",
    desc: "I built this portfolio for Connor Taleb with React and Vite. It has responsive pages, an MDX blog, and a Vercel deployment.",
    badge: "React / Vite",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["React", "TypeScript", "Vite"],
    category: "Website",
    status: "Complete",
  },
  {
    href: "/projects/server",
    title: "Homelab / Server",
    desc: "An old PC running Ubuntu Server, Docker, and Portainer for media, dashboards, and whatever I am testing that week.",
    badge: "Ubuntu / Docker",
    technologies: ["Ubuntu", "Docker", "Portainer"],
    category: "Infrastructure",
    status: "Active",
  },
  {
    href: "https://github.com/Charlie284/random-username-generator",
    title: "Username Generator",
    desc: "A tiny browser tool that mixes adjectives, nouns, and verbs into random usernames. It does not send or track anything.",
    badge: "JavaScript / Web",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["JavaScript"],
    category: "Tool",
    status: "Complete",
  },
  {
    href: "https://github.com/Charlie284/sysinfo",
    title: "Sysinfo CLI",
    desc: "A small Python command that prints the details I usually want first: OS, kernel, CPU, memory, disk space, and uptime.",
    badge: "Python / Utility",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["Python"],
    category: "Tool",
    status: "Complete",
  },
  {
    href: "https://github.com/Charlie284/password-strength-checker",
    title: "Password Strength Checker",
    desc: "A password checker that explains its score while you type. Everything stays in the browser.",
    badge: "JavaScript / Security",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["JavaScript"],
    category: "Tool",
    status: "Complete",
  },
  {
    href: "https://github.com/Charlie284/PI-HTML",
    title: "PI-HTML",
    desc: "The first 10 million digits of pi in a self-contained HTML page and a plain-text file. That is the whole project.",
    badge: "HTML / Archive",
    buttonText: "View on GitHub",
    target: "_blank",
    technologies: ["HTML"],
    category: "Archive",
    status: "Complete",
  },
];
