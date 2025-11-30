import type { Metadata } from "next";
import "./globals.css";
// Bryntum SchedulerPro CSS - main styles + theme
import "@bryntum/schedulerpro/schedulerpro.css";
import "@bryntum/schedulerpro/stockholm-light.css";

export const metadata: Metadata = {
  title: "Caire Scheduling",
  description: "Intelligent route optimization and scheduling",
  authors: [{ name: "Caire Work Sample" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-background text-slate-900 flex flex-row overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
