//Questo serve solo a React.
// serve ad ottenere i dati sessione dal server, in modo da poter fare operazioni tipo:
// if (!session) return <LoginButton />

"use client";

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
