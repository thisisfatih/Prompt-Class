// src/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import NavBar from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="container max-w-md py-4">
          <NavBar /> {/* ← back! */}
          <main className="pt-4">{children}</main>
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
