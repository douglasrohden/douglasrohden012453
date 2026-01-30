import fs from "fs";
import path from "path";

const srcDir = path.join(process.cwd(), "src");

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else files.push(full);
  }
  return files;
}

function isTestFile(file) {
  // support several common test extensions
  return (
    file.endsWith(".test.tsx") ||
    file.endsWith(".spec.tsx") ||
    file.endsWith(".test.ts") ||
    file.endsWith(".spec.ts") ||
    file.endsWith(".test.js") ||
    file.endsWith(".spec.js")
  );
}

function looksLikeGenerated(content) {
  // Matches our generator template (renders without crashing + toBeDefined) or our marker
  return (
    content.includes("it('renders without crashing')") ||
    content.includes("it('renders without crashing')") ||
    content.includes("expect(container).toBeDefined()") ||
    content.includes("AUTO-GENERATED TEST") ||
    content.includes("renders default structure") ||
    content.includes("handles a basic user interaction") ||
    content.includes("responds to prop changes") ||
    content.includes("invokes callback props") ||
    content.includes("// AUTO-GENERATED TEST")
  );
}

function main() {
  // CLI args: --force (delete all test files), --pattern <substring|regex>
  const args = process.argv.slice(2);
  // Accept both --force (may collide with npm) and --all (safer to pass via npm)
  const force = args.includes("--force") || args.includes("--all");
  const patternIndex = args.indexOf("--pattern");
  const pattern = patternIndex >= 0 ? args[patternIndex + 1] : null;

  if (!fs.existsSync(srcDir)) {
    console.error("Source directory not found:", srcDir);
    process.exit(1);
  }

  const all = walkDir(srcDir);
  const tests = all.filter(isTestFile);
  let deleted = 0;

  for (const file of tests) {
    try {
      const content = fs.readFileSync(file, "utf8");

      const shouldDelete = (() => {
        if (force) {
          if (pattern) {
            // match filename or relative path
            const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
            try {
              const re = new RegExp(pattern);
              return re.test(rel) || rel.includes(pattern);
            } catch (e) {
              return rel.includes(pattern);
            }
          }
          return true; // force delete all test files
        }

        return looksLikeGenerated(content);
      })();

      if (shouldDelete) {
        fs.unlinkSync(file);
        console.log("Deleted", path.relative(process.cwd(), file));
        deleted++;
      }
    } catch (err) {
      console.error("Failed to process", file, err);
    }
  }

  console.log(`Done. Deleted ${deleted} generated test file(s).`);

  // Cleanup empty __tests__ directories
  const cleanupEmptyDirs = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        cleanupEmptyDirs(fullPath);
        if (entry.name === "__tests__" && fs.readdirSync(fullPath).length === 0) {
          fs.rmdirSync(fullPath);
          console.log("Removed empty directory", path.relative(process.cwd(), fullPath));
        }
      }
    }
  };
  cleanupEmptyDirs(srcDir);
}

main();
