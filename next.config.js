/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Case-photo uploads go through a Server Action. The default body limit is
      // 1MB, which would reject typical photos; the app + storage bucket cap files
      // at 5MB, so allow headroom above that for multipart overhead.
      bodySizeLimit: "8mb"
    }
  }
};

module.exports = nextConfig;
