import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import styles from "./css/Ask.module.css";
// import { json } from "stream/consumers";

export default function QuestionPage() {
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const { data: session } = useSession();

  const email = session?.user?.email || "";
  const token = session?.backendAccessToken || "";

  const handle_LLM_response = async () => {
    // console.log("question here = ", question);
    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: JSON.stringify({
          question: question,
        }),
        headers: {
          // il browser attiva automaticamente una CORS preflight request. (Quindi devi abilitare coors al backend)
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Token deve essere in string type, non object ({email:.., name:...) per
          // essere validata dal nostro backend
        },
      });

      const data = await response.json();
      setMessage(data.answer || "transfere completed");
    } catch (error) {
      setMessage("Error message ");
    }
  };

  return (
    <div className={styles.page}>
      {/* CHAT PAGE */}
      <div className={styles.card}>
        <input
          className={styles.input}
          type="text"
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <div className={styles.buttonsRow}>
          <button
            className={styles.buttonPrimary}
            onClick={handle_LLM_response}
          >
            Send Question
          </button>

          <button className={styles.buttonSecondary} onClick={() => signOut()}>
            Logout
          </button>
        </div>

        {message && <div className={styles.responseBox}>{message}</div>}
      </div>
    </div>
  );
  // return (
  //   <div className="p-10 space-y-4">
  //     <h2>Welcome {email}</h2>

  //     <input
  //       type="text"
  //       value={question}
  //       onChange={(e) => {
  //         setQuestion(e.target.value);
  //       }}
  //     />

  //     <button
  //       className="bg-blue-500 text-white px-4 py-2"
  //       onClick={handle_LLM_response}
  //     >
  //       send question
  //     </button>

  //     <button
  //       className="bg-gray-500 text-white px-4 py-2"
  //       onClick={() => signOut()}
  //     >
  //       Logout
  //     </button>

  //     {message && <p>{message}</p>}
  //     {/* {question} */}
  //   </div>
  // );
}
