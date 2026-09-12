import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/**
 * ESLint 9 flat config. This app never had `next lint` bootstrapped (no
 * `.eslintrc*`, no `eslint` dependency) — this is a first-time setup, not a
 * migration of an existing config, following the same shape already proven
 * in `nutrition-client` and the restaurant pair. `prettier` last, so
 * formatting rules never fight the formatter.
 */
export default [
  { ignores: [".next/**", "node_modules/**", "public/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
