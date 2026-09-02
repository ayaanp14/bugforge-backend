/**
 * Moved to src/lib/driver-codegen.ts so the server can apply drivers at
 * execution time (the editor only ever shows the solution stub).
 * This shim keeps existing script imports working.
 */
export * from "../src/lib/driver-codegen.js";
