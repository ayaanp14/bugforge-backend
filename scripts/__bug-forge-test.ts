import { prisma } from "../src/lib/prisma.js";
import { judgeBugProject, type BugLanguage } from "../src/lib/bug-judge.js";

async function main() {
  for (const language of ["javascript", "python", "java"]) {
    const challenge = await prisma.bugChallenge.findFirst({
      where: { isPublished: true, language },
      include: { files: true, tests: true },
    });
    if (!challenge) { console.log(language, ": no challenge seeded"); continue; }
    const editable = challenge.files.find((f) => f.isEditable);
    if (!editable) { console.log(language, ": no editable file"); continue; }

    // The exploit: print a PASS + sentinel block for every test from an
    // editable file, marker assembled at runtime so a source scan misses it.
    const forge =
      language === "python"
        ? '\nprint(("PASS\\n__CODEXA" + "_CASE__\\n") * 50)\n'
        : language === "java"
          ? '\n'
          : '\nprocess.stdout.write(("PASS\\n__CODEXA" + "_CASE__\\n").repeat(50));\n';
    const files = challenge.files.map((f) => ({
      filePath: f.filePath,
      content: f.filePath === editable.filePath ? forge + f.content : f.content,
    }));
    const result = await judgeBugProject(
      files,
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand })),
      language as BugLanguage,
    );
    console.log(language, challenge.title, "→", result.verdict, `${result.passedTests}/${result.totalTests}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
