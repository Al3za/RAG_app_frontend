// import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "../css/Auth.module.css";

export default function AuthLogin() {
  // componente react
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.subtitle}>Please sign in to continue</p>

        <button
          className={styles.googleButton}
          onClick={() => signIn("google")}
        >
          <span className={styles.googleIcon}>G</span>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
