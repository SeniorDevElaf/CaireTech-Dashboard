/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Bryntum packages for proper ESM support
  transpilePackages: ["@bryntum/schedulerpro", "@bryntum/schedulerpro-react"],
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["@bryntum/schedulerpro-react"],
  },
};

module.exports = nextConfig;

