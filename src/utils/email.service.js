import nodemailer from "nodemailer";

const getRequiredEnv = (key, fallbackKeys = []) => {
  const allKeys = [key, ...fallbackKeys];

  for (const envKey of allKeys) {
    const value = process.env[envKey]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing SMTP environment variable. Provide one of: ${allKeys.join(", ")}`);
};

export const createTransporter = () => {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(
    process.env.SMTP_PORT?.trim() || process.env.EMAIL_PORT || "465",
  );
  const user = getRequiredEnv("SMTP_EMAIL", ["SMTP_USER", "EMAIL_USER"]);
  const pass = getRequiredEnv("SMTP_PASSWORD", ["SMTP_PASS", "EMAIL_PASS"]);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};
