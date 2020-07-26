module.exports = {
  env: {
    PUBLIC_URL: process.env.DEV_URL || ("https://" + process.env.VERCEL_URL),
    SKYWAY_API_KEY: process.env.SKYWAY_API_KEY,
  },
};
