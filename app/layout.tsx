import "./globals.css";
import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME, ICON } from "@/lib/constants";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: APP_NAME,
  icons: {
    icon: ICON,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
