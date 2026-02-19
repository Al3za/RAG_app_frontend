import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UploadSection({ email }: { email: string }) {
  const [file, setFile] = useState<File | null>(null); // The File interface provides information
  // about files and allows JavaScript in a web page to access their content.
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("user_id", email);
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8000/upload_pdf", // local
        // "https://TUO-BACKEND-RENDER-URL/upload_pdf",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      setMessage(data.message || "Upload completed");
    } catch (error) {
      setMessage("Error uploading file");
    }
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
