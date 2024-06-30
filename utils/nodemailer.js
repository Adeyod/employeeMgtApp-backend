import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
  secure: process.env.SECURE,
  tls: { rejectUnauthorized: false },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const verifyEmailPath = join(__dirname, 'emailTemplates', 'verifyEmail.html');

const verifyEmailPathTemplate = readFileSync(verifyEmailPath, 'utf-8');

const verifyEmail = async ({ email, firstName, link }) => {
  try {
    const verifyEmailContent = verifyEmailPathTemplate
      .replace('{{firstName}}', firstName)
      .replace('{{link}}', link);

    const info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: 'Email verification',
      html: verifyEmailContent,
    });

    return info;
  } catch (error) {
    console.log(error);
  }
};

export { verifyEmail };
