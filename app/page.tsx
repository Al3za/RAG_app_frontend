"use client"; // because the client has to interect with it, meaning change its the state of userId a

// import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import UploadSection from "./upload";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <button
          className="bg-black text-white px-6 py-3"
          onClick={() => signIn("google")} // sign in again se il token expired
        >
          {" "}
          Sign in with Google
        </button>
      </div>
    );
  }

  return <UploadSection email={session.user?.email || ""} />;
}

// export default function Home() {
//   const [userId, setUserId] = useState("");
//   const [loggedIn, setLoggedIn] = useState(false);

//   return (
//     <div className="flex min-h-screen items-center justify-center">
//       {!loggedIn ? (
//         <div className="space-y-4">
//           <h1 className="text-2xl font-bold">RAG PDF Demo</h1>
//           <input
//             type="text"
//             placeholder="Enter your user ID"
//             className="border p-2 w-64"
//             value={userId}
//             onChange={(e) => setUserId(e.target.value)}
//           />
//           <button
//             className="bg-black text-white px-4 py-2"
//             onClick={() => {
//               if (userId.trim() !== "") {
//                 setLoggedIn(true);
//               }
//             }}
//           >
//             Enter
//           </button>
//         </div>
//       ) : (
//         <UploadSection userId={userId} /> // send pdf tho backend to perform pdf ingestion
//       )}
//     </div>
//   );
// }
