# Security

## Reporting

Please report a suspected vulnerability through GitHub's private vulnerability reporting feature. Do not include personal training data or unredacted backup files in a public issue.

## Deployment model

Match Point is deployed as static HTML, CSS, JavaScript, images, a Web App Manifest, and a Service Worker. The production application does not run a Node.js, Vite, Express, or DCloud development server.

CI runs `npm audit --omit=dev --audit-level=high` to block high-severity vulnerabilities in production dependencies.

## DCloud build-tool advisories

The current DCloud Vue 3 compiler requires Vite 5.2.8 and its bundled development-server dependencies. npm reports advisories against that build-only toolchain. The compatible Intlify and PostCSS transitive packages are overridden to patched releases; Vite, Express, Babel, and esbuild are not forced across incompatible versions.

Do not bind `npm run dev:h5` to a public or untrusted network. CI builds untrusted pull requests without deployment credentials, and GitHub Pages serves only the generated static output.
