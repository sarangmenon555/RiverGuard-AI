"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/floods-2018", label: "2018 Kerala Floods" },
  { href: "/history", label: "Trends" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-aqua-500/10 bg-navy-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Waves className="h-6 w-6 text-aqua-400" />
          <span className="text-lg font-semibold tracking-tight text-white">
            RiverGuard <span className="text-aqua-400">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-aqua-400 ${
                pathname === link.href ? "text-aqua-400" : "text-slate-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
