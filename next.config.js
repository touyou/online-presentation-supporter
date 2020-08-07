module.exports = {
  env: {
    PUBLIC_URL: process.env.DEV_URL || ("https://" + process.env.VERCEL_URL),
    SKYWAY_API_KEY: process.env.SKYWAY_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
  },
};
