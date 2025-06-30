import "../app/global.css";
import React from "react";

export const metadata = {
  title: "KnowFootball",
  description: "The place for all your football questions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
