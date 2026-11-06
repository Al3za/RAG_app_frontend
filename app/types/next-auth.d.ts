import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendAccessToken?: string;
  }
}
