import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Limphus — Compliance lead-gen and one-click advisory for MSPs",
  description: "Turn regulatory exposure into pipeline. Show firms their fine exposure in dollars (NYDFS, NIS2, HIPAA, LawPRO, SRA) and send the right advisory with one click. limphus.ca",
  openGraph: {
    title: "Limphus — Compliance lead-gen and one-click advisory for MSPs",
    description: "Turn regulatory exposure into pipeline. limphus.ca",
    url: "https://limphus.ca",
    siteName: "Limphus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen font-sans`}>
        <ClerkProvider>
          <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950/80">
            <Link href="/" className="text-zinc-200 font-semibold hover:text-white transition-colors">limphus.ca</Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">Sign up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
