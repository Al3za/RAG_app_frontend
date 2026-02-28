"use client"; // because the client has to interect with it, meaning change its the state of userId a

// import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import AuthLogin from "./login/auth_login";
import UploadSection from "./upload";
// import Test_email_jwt from "./teste_jwt";
import QuestionPage from "./chat";

export default function Home() {
  const { data: session, status } = useSession(); // cheks if session is not expired or exist
  // useSession() NextAuth decifra il token per te.

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // if session expired or user not logged in
  if (!session) {
    return <AuthLogin />;

    // return (
    //   <div className="flex min-h-screen items-center justify-center">
    //     <button
    //       className="bg-black text-white px-6 py-3"
    //       onClick={() => signIn("google")} // sign in again se il token expired
    //     >
    //       {" "}
    //       Sign in with Google
    //     </button>
    //   </div>
    // );
  }

  // const token = session.user;

  return <UploadSection />;
  // return <Test_email_jwt />;
  // return <QuestionPage />;
}
