/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '', // e.g., '/myapp' if you're deploying in a subfolder
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
