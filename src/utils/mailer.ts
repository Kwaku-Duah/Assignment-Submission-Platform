import nodemailer from "nodemailer";
import { ADMIN_MAIL, ADMIN_PASS } from "../secrets";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ADMIN_MAIL,
    pass: ADMIN_PASS
  }
});
