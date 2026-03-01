"use client"; // questa e' di default quado usiamo usestate o useRouter in una pagina next.
// vuol dire che non sono server side page, ma generate dal browser con funzionalita js(interative buttons ecc...)

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../css/Ask.module.css";
// import styles from "./css/Ask.module.css";
// import styles from "./Ask.module.css";
// import { json } from "stream/consumers";

export default function QuestionPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const { data: session, status } = useSession(); // asyncron Google function. When lo stato e' attivo
  // verra si attiva lo useState
  const router = useRouter();

  // se un utente cerca di andare su questa route prima che il pdf sia stato 'ingerito', lo rimandiamo indietro
  // su upload page
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.backendAccessToken) {
      // if no logged in redirect to home page
      router.push("/"); // i router change meglio dentro useEffect, da evitare nel render della pagina
      return; // UseEffect viene chiamato dopo che la pagina e' stata renderizzata, ed e meglio fare eventuali
      // route changes tra pagine dopo che avviene la renderizzazione della pagina (appunto dentro useEffect)
    }

    const checkStatus = async () => {
      const token = session?.backendAccessToken || "";

      try {
        const res = await fetch("http://localhost:8000/ingestion_status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ingest_status_data = await res.json();

        if (ingest_status_data.status === "ready") {
          setAllowed(true);
        } else {
          router.push("/"); // home page where we upload again
        }
      } catch (error) {
        // alert(`server may down, error = ${error}`);
        console.error(error);
        router.push("/");
      }
    };
    checkStatus(); // start status polling
  }, [status, session, router]); /*[status, session]*/ // status, session sono funzioni asyncrone di google. Quando queste verranno lette
  // in questo file, allora si avvia useEffect e' vede se l'utente e loggato in e se il pdf e' stato ingerito
  // prima di ancare avanto con Il questionPage file e poter interagire con LLM

  useEffect(() => {
    // useEffect per fare il messaggio 'await for response...' iterattivo, mostrando i puntini ogni tot sec
    if (!loading) return;

    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 6); // Aggiunge i puntini ad ogni secondo alla frase
      // 'await for response..'
      // 0 → 1 → 2 → 3 → 0
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]); // Starts quando loading cambia state

  if (!allowed) {
    // if pdf_ingest_status != 'ready'
    return <div>Checking document status... </div>;
  }

  const handle_LLM_response = async () => {
    // const email = session?.user?.email || "";
    if (!question) return /*<div> Write a valid question please</div>*/;
    const token = session?.backendAccessToken || ""; // custom backend token (per il nostro backend)
    // console.log("question here = ", question);
    // setAwaitLLMRes(false);
    try {
      setLoading(true);
      setMessage(""); // puliamo messages precedenti
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
      // setAwaitLLMRes(true);
    } catch (error) {
      setMessage("Error message, Please refresh and try again ");
    } finally {
      setLoading(false);
    }
  };

  // if (!awaitLLMRes) {
  //   return <div> Wait for response </div>;
  // }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <input
          className={styles.input}
          type="text"
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* SOLO BOTTONI QUI DENTRO */}
        <div className={styles.buttonsRow}>
          <button
            className={`${styles.buttonPrimary} ${
              loading ? styles.buttonDisabled : ""
            }`}
            onClick={handle_LLM_response}
            disabled={loading}
          >
            {loading ? "Waiting" : "Send Question"}
          </button>

          <button className={styles.buttonSecondary} onClick={() => signOut()}>
            Logout
          </button>
        </div>

        {/* FUORI DAI BOTTONI */}
        {loading && (
          <div className={styles.loading}>
            Waiting for response{" .".repeat(dotCount)}{" "}
            {/* <span className={styles.dots}></span> */}
          </div>
        )}

        {!loading && message && (
          <div className={styles.responseBox}>{message}</div>
        )}
      </div>
    </div>
  );
}
// return (
//   <div className="p-10 space-y-4">
//     <h2>Welcome till Chat page {/*{email}*/} </h2>
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
// }
