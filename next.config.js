const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  serverExternalPackages: ['pdf-parse'],
  images: {
    domains: ['s.gravatar.com', 'cdn.auth0.com', 'develop.file.force.com', 'lh3.googleusercontent.com'],
  },
});
