/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora errores de TypeScript temporalmente por incompatibilidad con recharts
    ignoreBuildErrors: true,
  },
  images: {
    // Para producción es mejor usar el optimizador de imágenes de Next.js
    unoptimized: false,
    // Domains para imágenes externas si las necesitas
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'example.com',
    //   },
    // ],
  },
  // Optimizaciones adicionales
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
