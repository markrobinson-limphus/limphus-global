"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, FileText, MapPin, Settings, Users } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: MapPin },
  { href: "/dashboard/drafts", label: "Drafts", icon: FileText },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-zinc-800 bg-zinc-950/50 p-4 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">L</span>
          <span className="font-semibold">Limphus Global</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href ? "bg-emerald-600/20 text-emerald-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-zinc-800">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
      <main className="p-6 overflow-auto">{children}</main>
    </div>
  );
}
