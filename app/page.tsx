"use client"; // because the client has to interect with it, meaning change its the state of userId a

// import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import AuthLogin from "./login/auth_login";
import UploadSection from "./upload";
import Test_email_jwt from "./teste_jwt";
// import QuestionPage from "./chat";

export default function Home() {
  const { data: session, status } = useSession(); // cheks if session is not expired or exist
  // useSession() NextAuth decifra il token per te.

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // if session expired or user not logged in
  if (!session) {
    return <AuthLogin />;
  }

  // const token = session.user;

  return (
    <UploadSection />
    // <Test_email_jwt />
    // return <QuestionPage />;
  );
}
