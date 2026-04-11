import axios from "axios";

const JUDGE0_URL = process.env["JUDGE0_URL"] || "http://localhost:2358";

// Map our frontend language names to Judge0 IDs
// See: https://ce.judge0.com/languages/all
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  python: 71,     // Python 3.8.1
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54,        // C++ (GCC 9.2.0)
  c: 50,          // C (GCC 9.2.0)
  go: 60,         // Go 1.13.5
  csharp: 51,     // C# (Mono 6.6.0.161)
  kotlin: 78,     // Kotlin (1.3.70)
  swift: 83,      // Swift (5.2.3)
  rust: 73,       // Rust (1.40.0)
  php: 68,        // PHP (7.4.1)
  ruby: 72,       // Ruby (2.7.0)
};

export interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string;
  memory: number;
  status: {
    id: number;
    description: string;
  };
}

export class Judge0Service {
  /**
   * Executes code using Judge0 and waits for the result
   */
  static async execute(code: string, language: string, stdin?: string): Promise<Judge0Response> {
    const languageId = LANGUAGE_MAP[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      // 1. Submit the code
      const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
        source_code: Buffer.from(code).toString("base64"),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString("base64") : null,
      });

      const { token } = response.data;

      // 2. Poll for the result
      return await this.pollResult(token);
    } catch (err: any) {
      console.error("Judge0 Execution Error:", err.response?.data || err.message);
      throw new Error("Failed to execute code in sandbox");
    }
  }

  private static async pollResult(token: string): Promise<Judge0Response> {
    const maxRetries = 10;
    const interval = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
       const response = await axios.get(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`);
       const { status } = response.data;

       // Status IDs 1 (In Queue) and 2 (Processing) mean it's not ready
       if (status.id > 2) {
         return {
           ...response.data,
           stdout: response.data.stdout ? Buffer.from(response.data.stdout, "base64").toString("utf-8") : null,
           stderr: response.data.stderr ? Buffer.from(response.data.stderr, "base64").toString("utf-8") : null,
           compile_output: response.data.compile_output ? Buffer.from(response.data.compile_output, "base64").toString("utf-8") : null,
           message: response.data.message ? Buffer.from(response.data.message, "base64").toString("utf-8") : null,
         };
       }

       await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Execution timed out in sandbox");
  }
}
