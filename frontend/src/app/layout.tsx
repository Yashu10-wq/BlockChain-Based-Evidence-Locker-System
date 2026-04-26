import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evidence Locker — Secure Digital Evidence Management",
  description: "Blockchain-secured evidence management system for law enforcement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    police: { DEFAULT: '#002366', light: '#1E3A5F' },
                  }
                }
              }
            }
          `
        }}></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
