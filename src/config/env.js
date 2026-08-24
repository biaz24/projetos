import dotenv from "dotenv";

dotenv.config();

const env = {
  port: process.env.PORT || 3000,

  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "projetos",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access_secret_dev",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret_dev",
  },
};

export default env;
