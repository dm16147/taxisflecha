/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        BASE_API_KEY: process.env.BASE_API_KEY,
        BASE_API_URL: process.env.BASE_API_URL,
    }
};

module.exports = nextConfig