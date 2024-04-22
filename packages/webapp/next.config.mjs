// https://github.com/livekit/client-sdk-js/issues/938#issuecomment-1814441537 explains a bug in nextjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: '**.supabase.co',
    //     port: '',
    //   },
    // ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: 'file-loader',
      },
    });
    return config;
  },
};

export default nextConfig;
