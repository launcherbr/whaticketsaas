const secret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET environment variable must be defined");
}

if (!refreshSecret) {
  throw new Error("JWT_REFRESH_SECRET environment variable must be defined");
}

export default {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
};
