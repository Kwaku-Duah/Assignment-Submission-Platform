import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const ADMIN_MAIL = process.env.ADMIN_MAIL;
export const ADMIN_PASS = process.env.ADMIN_PASS;
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
