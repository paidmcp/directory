import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { RouteTransition } from "../components/RouteTransition";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://paidmcp.dev"),
  title: {
    default: "PaidMCP Directory",
    template: "%s | PaidMCP Directory",
  },
  description:
    "Discover and install paid MCP servers with transparent per-call pricing.",
  applicationName: "PaidMCP Directory",
  openGraph: {
    title: "PaidMCP Directory",
    description:
      "Discover and install paid MCP servers with transparent per-call pricing.",
    url: "https://paidmcp.dev",
    siteName: "PaidMCP Directory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PaidMCP Directory",
    description:
      "Discover and install paid MCP servers with transparent per-call pricing.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-30" />
        <header className="sticky top-0 z-20 border-b border-neutral-800/70 glass">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="font-semibold tracking-wide text-neutral-100"
            >
              paidmcp.dev
            </Link>
            <nav className="flex items-center gap-5 text-sm text-neutral-300">
              <Link className="hover:text-white" href="/submit">
                Submit
              </Link>
              <Link className="hover:text-white" href="/build">
                Build
              </Link>
              <Link className="hover:text-white" href="/connect">
                Connect
              </Link>
              <Link
                className="hover:text-white"
                href="https://github.com/paidmcp"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </nav>
          </div>
        </header>
        <RouteTransition>{children}</RouteTransition>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
        <footer className="mt-20 border-t border-neutral-800/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-neutral-400">
            <p>PaidMCP Directory</p>
            <p>Built for agentic AI tools</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
