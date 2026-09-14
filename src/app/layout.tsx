import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";
import { SiteHeader } from "@/components/site-header";
import { NightBanner } from "@/components/night-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Midnight BSH",
  description:
    "A social app for posting bullshit — but only between 9pm and 9am.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <NightBanner />
          <SiteHeader />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">
            Midnight BSH — open 9pm–9am. Certificates are self-declared and
            entirely for fun.
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
