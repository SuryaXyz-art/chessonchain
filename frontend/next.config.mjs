import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        // Resolve modules from root node_modules (monorepo hoisting)
        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '..', 'node_modules'),
            'node_modules',
        ];
        return config;
    },
};

export default nextConfig;
