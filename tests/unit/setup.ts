import "@testing-library/jest-dom/vitest";

// Stable secret so HMAC-based tokens deterministic in tests.
process.env.AUTH_SESSION_SECRET ||=
  "test-secret-do-not-use-in-production-must-be-32+chars-long-here";
