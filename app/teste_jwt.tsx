import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Test_email_jwt() {
  const [message, setMessage] = useState("");
  const { data: session } = useSession();

  const email = session?.user?.email || "";
  const token = session?.backendAccessToken || "";

  const handleTestJwt = async () => {
    //
    console.log("render hit");
    try {
      const response = await fetch(
        "https://rag-app-2s6e.onrender.com/redis_test",
        // "http://localhost:3000/api/healt", for ping by uptime robot (mvp only)
        {
          method: "GET",
          headers: {
            // il browser attiva automaticamente una CORS preflight request. (Quindi devi abilitare coors al backend)
            Authorization: `Bearer ${token}`, // Token deve essere in string type, non object ({email:.., name:...) per
            // essere validata dal nostro backend
          },
        },
      );

      const data = await response.json();
      console.log(data.value, "here value");
      console.log("data here", data);
      // setMessage(data.message || "transfere completed");
      setMessage(data.value || "value value");
    } catch (error) {
      setMessage("Error message ");
    }
  };

  return (
    <div className="p-10 space-y-4">
      <h2>Welcome {email}</h2>

      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleTestJwt}
      >
        send jwt token and verify
      </button>

      <button
        className="bg-gray-500 text-white px-4 py-2"
        onClick={() => signOut()}
      >
        Logout
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
