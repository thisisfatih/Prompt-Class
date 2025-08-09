import "./globals.css";
import { ReactNode } from "react";
import NavBar from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto max-w-md px-4 py-4">
          <NavBar />
          <main className="pt-4 space-y-4">{children}</main>
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
