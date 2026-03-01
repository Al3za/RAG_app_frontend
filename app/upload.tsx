import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import styles from "./css/upload.module.css";
// import router from "next/router";
import { useRouter } from "next/navigation";

export default function UploadSection() {
  const [file, setFile] = useState<File | null>(null); // The File interface provides information
  // about files and allows JavaScript in a web page to access their content.
  const [loading, setLoading] = useState(false);
  // const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email || ""; // serve al fronten per "Hallo akekacabro@gmail.com". (Al backend bisogna inviare solo il token
  // per ottenere l'email dopo encoding)
  const token = session?.backendAccessToken || "";
  const API_URL = process.env.NEXT_PUBLIC_API_URL; // non avere questa env in .env locale per testare
  // in dev mode. Ma devi averla in .env su render per poter lavorare su render

  // useEffect parte solo dopo che la pagina e' stata renderizzata e quando cambia 'loading'.
  useEffect(() => {
    // Più pulito.
    // Più controllabile.
    // Nessun rischio di loop infinito nascosto
    if (!loading) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 180; // 5 min  //60; // 2 minuti

    const ingestion_status_interval = setInterval(async () => {
      console.log("attempts here =", attempts);
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(ingestion_status_interval);
        setLoading(false);
        setMessage("Processing timeout. Please retry.");
        return;
      }

      try {
        // polling to check the status of the ingestion
        const res = await fetch(
          API_URL
            ? `${API_URL}/ingestion_status` //  // for render
            : "http://localhost:8000/ingestion_status",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();

        if (data.status === "ready") {
          clearInterval(ingestion_status_interval); // loops stops
          router.push("/questions"); // go to question page
        }

        if (data.status === "processing") {
          // setAttempts((prev) => prev + 1);
          setMessage(
            // change loading message
            `Processing PDF, please wait${" .".repeat((attempts % 3) + 1)}`,
          );
        }
        if (data.status === "error") {
          // it can fall in the catch error
          clearInterval(ingestion_status_interval); // blocca il loop
          setMessage("");
          setLoading(false);
          alert("Error in pdf ingestion, refresh the page and retry please");
        }
      } catch (err) {
        // catch error del fetch
        clearInterval(ingestion_status_interval);
        alert(`server may down, error = ${err}`);
        setLoading(false);
        setMessage("");
      }
    }, 2000); // ogni 2 sec riparte il loop

    return () => clearInterval(ingestion_status_interval);
  }, [loading]); // il loop parte quando loading state cambia (true/false)

  const handleUpload = async () => {
    // const Iter_message = [
    //   // iterative message for the user once he upload pdf
    //   "Processing PDF, please wait .",
    //   "Processing PDF, please wait ..",
    //   "Processing PDF, please wait ...",
    // ];

    if (!file) return alert("Choose a valid pdf file");
    // const router = useRouter(); // questo e' un react hook. puo essere chiamato solo dentro il corpo del componente madre, e mai dentro
    // funzioni normali, if statement, loop...
    setMessage(
      "Processing PDF, please wait..." /*data.message || "Upload completed"*/,
    );
    // const token = session?.backendAccessToken || ""; // questo e' il token dedicato al backend che serve
    // come garante che siamo inloggad correttamente prima di accedere alle api del backend.
    // questo token verra' "verified" e fatto il payload nel backend, in modo da ottenere l'email
    // e poter fare l'ash di questa per multitenat rag app (boto 3, namespaces)

    const formData = new FormData();
    formData.append("file", file); // Usa FormData solo quando stai uploadando file (upload_pdf) o mandando imagini
    // i body di testo con json stringfy
    try {
      const response = await fetch(
        API_URL
          ? `${API_URL}/upload_pdf` // for render
          : "http://localhost:8000/upload_pdf", // local
        // "https://rag-app-2s6e.onrender.com/upload_pdf",
        {
          method: "POST",
          body: formData,
          headers: {
            // il browser attiva automaticamente una CORS preflight request. (Quindi devi abilitare coors al backend)
            Authorization: `Bearer ${token}`, // Token deve essere in string type, non object ({email:.., name:...) per
            // essere validata dal nostro backend
          },
        },
      );

      // error del backend se > 50 pages di pdf)
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail); // error del backend (> 50 pages di pdf)
        return;
      }

      const data = await response.json();
      console.log(data.message); // il pdf e' stato caricato su s3 e pronto per chunking.
      // quindi possiamo avviare il useEffect che fa' polling sul chunking/pinecone status
      setLoading(true); // qua parte lo use'effect
      // setMessage(
      //   "Processing PDF, please wait..." /*data.message || "Upload completed"*/,
      // );
      setLoading(true); // qua parte lo use'effect
    } catch (error) {
      // error generale se il server crasha, o se e' spento
      setMessage("Error uploading file");
      setLoading(false);
    }

    // CHECK THE STATUS OF THE INGESTION, AND SEND THE USER TO "CHAT" PAGE ONCE INGESTION AND S3/PINECONE PDF DATA STORAGE
    // let attempts = 0;
    // const MAX_ATTEMPTS = 180; // 5 min  //60; // 2 minuti

    // const checkStatus = async () => {
    //   // polling function per vedere pdf status. Viene chiamata ogni 2 sec
    //   // Metti un limite massimo di tentativi, altrimenti se qualcosa va storto polli per sempre.
    //   if (attempts >= MAX_ATTEMPTS) {
    //     alert("Processing timeout");
    //     return;
    //   }
    //   attempts++;
    //   // here starts the status polling
    //   try {
    //     const res = await fetch("http://localhost:8000/ingestion_status", {
    //       headers: { Authorization: `Bearer ${token}` },
    //     });

    //     const ingest_status_data = await res.json();

    //     if (ingest_status_data.status === "ready") {
    //       router.push("/questions");
    //     } else if (ingest_status_data.status === "processing") {
    //       setMessage(
    //         `Processing PDF, please wait${" .".repeat((attempts % 3) + 1)}`,
    //       );
    //       // const chose_mg = attempts % 3;
    //       // setMessage(Iter_message[chose_mg]);
    //       setTimeout(checkStatus, 2000); // check the status of the pdf ingestion until it is ingested
    //       // and stored in s3 and pinecone
    //     } else if (ingest_status_data.status === "error") {
    //       setMessage("");
    //       alert("Error in pdf ingestion, refresh the page and retry please"); //
    //     } else {
    //       setTimeout(checkStatus, 2000); // fallback
    //     }
    //   } catch (error) {
    //     alert(`server may down, error = ${error}`);
    //     setMessage("");
    //   }
    // };
    // checkStatus(); // start status polling
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome {email}</h2>

        <input
          className={styles.fileInput}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files) setFile(e.target.files[0]);
          }}
        />

        <div>
          <button className={styles.buttonPrimary} onClick={handleUpload}>
            Upload PDF
          </button>

          <button className={styles.buttonSecondary} onClick={() => signOut()}>
            Logout
          </button>
        </div>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );

  // return (
  //   <div className="p-10 space-y-4">
  //     <h2>Welcome {email}</h2>

  //     <input
  //       type="file"
  //       accept=".pdf"
  //       onChange={(e) => {
  //         if (e.target.files) {
  //           setFile(e.target.files[0]);
  //         }
  //       }}
  //     />

  //     <button
  //       className="bg-blue-500 text-white px-4 py-2"
  //       onClick={handleUpload}
  //     >
  //       Upload PDF
  //     </button>

  //     <button
  //       className="bg-gray-500 text-white px-4 py-2"
  //       onClick={() => signOut()}
  //     >
  //       Logout
  //     </button>

  //     {message && <p>{message}</p>}
  //   </div>
  // );
}
