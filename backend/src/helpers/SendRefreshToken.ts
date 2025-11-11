import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";
const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

export const SendRefreshToken = (res: Response, token: string): void => {
  res.cookie("jrt", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: sevenDaysInMs
  });
};
