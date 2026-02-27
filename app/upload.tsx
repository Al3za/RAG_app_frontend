import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
// import router from "next/router";
import { useRouter } from "next/navigation";

export default function UploadSection() {
  const [file, setFile] = useState<File | null>(null); // The File interface provides information
  // about files and allows JavaScript in a web page to access their content.
  const [message, setMessage] = useState("");
  const { data: session } = useSession();
  const email = session?.user?.email || ""; // serve al fronten per "Hallo akekacabro@gmail.com". (Al backend bisogna inviare solo il token
  // per ottenere l'email dopo encoding)
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    // console.log("handleUpload");
    // const router = useRouter(); // questo e' un react hook. puo essere chiamato solo dentro il corpo del componente madre, e mai dentro
    // funzioni normali, if statement, loop...
    const token = session?.backendAccessToken || ""; // questo e' il token dedicato al backend che serve
    // come garante che siamo inloggad correttamente prima di accedere alle api del backend.
    // questo token verra' "verified" e fatto il payload nel backend, in modo da ottenere l'email
    // e poter fare l'ash di questa per multitenat rag app (boto 3, namespaces)

    const formData = new FormData();
    formData.append("file", file); // Usa FormData solo quando stai uploadando file (upload_pdf) o mandando imagini
    // i body di testo con json stringfy
    try {
      const response = await fetch(
        "http://localhost:8000/upload_pdf", // local
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
      setMessage(
        "Processing PDF, please wait..." /*data.message || "Upload completed"*/,
      );
    } catch (error) {
      // error generale se il server crasha, o se e' spento
      setMessage("Error uploading file");
    }

    // CHECK THE STATUS OF THE INGESTION, AND SEND THE USER TO "CHAT" PAGE ONCE INGESTION AND S3/PINECONE PDF DATA STORAGE
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 2 minuti

    const checkStatus = async () => {
      // Metti un limite massimo di tentativi, altrimenti se qualcosa va storto polli per sempre.
      if (attempts >= MAX_ATTEMPTS) {
        alert("Processing timeout");
        return;
      }
      attempts++;
      // here starts the status polling
      try {
        console.log("ingestion_status");
        const res = await fetch("http://localhost:8000/ingestion_status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ingest_status_data = await res.json();
        console.log("ingest_status_data.status =", ingest_status_data.status);

        if (ingest_status_data.status === "ready") {
          router.push("/questions");
        } else if (ingest_status_data.status === "processing") {
          setTimeout(checkStatus, 2000); // check the status of the pdf ingestion until it is ingested
          // and stored in s3 and pinecone
        } else if (ingest_status_data.status === "error") {
          alert("Error in pdf ingestion"); // we are here
        } else {
          setTimeout(checkStatus, 2000); // fallback
        }
      } catch (error) {
        alert(`server may down, error = ${error}`);
      }
    };
    checkStatus(); // start status polling
  };

  return (
    <div className="p-10 space-y-4">
      <h2>Welcome {email}</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          if (e.target.files) {
            setFile(e.target.files[0]);
          }
        }}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleUpload}
      >
        Upload PDF
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
