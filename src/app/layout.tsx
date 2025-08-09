import "./globals.css";
import { ReactNode } from "react";
import NavBar from "@/components/nav-bar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="container max-w-md py-4">
          <NavBar />
          <main className="pt-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
