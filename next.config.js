/** @type {import('next').NextConfig} */
const nextConfig = {
    typedRoutes: true,
    env: {
        VITE_BASE_API_KEY: process.env.VITE_BASE_API_KEY,
        VITE_BASE_API_URL: process.env.VITE_BASE_API_URL,
    }
};

module.exports = nextConfig