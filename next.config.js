/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow streaming responses longer than the Vercel default 30s edge limit
  experimental: {
    serverComponentsExternalPackages: [
      "@langchain/langgraph",
      "@langchain/core",
      "@langchain/anthropic",
      "@langchain/groq",
      "@langchain/openai",
    ],
  },
};

module.exports = nextConfig;

