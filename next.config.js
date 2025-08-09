/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    "*": ["**/.trunk/**"], // keep tracer (and Turbopack) away from .trunk
  },
  eslint: { dirs: ["app", "components", "lib", "pages", "src"] },
};
module.exports = nextConfig;
