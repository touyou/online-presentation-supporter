module.exports = {
  env: {
    PUBLIC_URL: process.env.DEV_URL || ("https://" + process.env.VERCEL_URL),
  }
}
