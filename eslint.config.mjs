import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  // Node-only operational scripts (not part of the Next.js app/browser bundle).
  { ignores: ["scripts/**"] },
  ...nextVitals
];

export default eslintConfig;
