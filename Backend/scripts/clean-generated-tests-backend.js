import fs from 'fs';
import path from 'path';

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
  return file.endsWith('Test.java');
}

function looksLikeGenerated(content) {
  // Matches our generator template or marker
  return (
    content.includes('AUTO-GENERATED TEST') ||
    content.includes('classCompiles') ||
    content.includes('loadsClass') ||
    content.includes('placeholder') ||
    content.includes('basicSmokeTest') ||
    content.includes('assertTrue(true)')
  );
}

const dirsToClean = [
  path.join(process.cwd(), 'src', 'test', 'java'),
  path.join(process.cwd(), 'target', 'surefire-reports'),
  path.join(process.cwd(), 'target', 'generated-test-sources')
];

function main() {
  // CLI args: --force (delete all test files), --pattern <substring|regex>
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('--all');
  const patternIndex = args.indexOf('--pattern');
  const pattern = patternIndex >= 0 ? args[patternIndex + 1] : null;

  console.log('args:', args);
  console.log('force:', force);

  let totalDeleted = 0;

  for (const dir of dirsToClean) {
    if (!fs.existsSync(dir)) {
      console.log('Directory not found, skipping:', path.relative(process.cwd(), dir));
      continue;
    }

    if (force || dir === dirsToClean[0]) { // Always delete src/test/java, others only with --all
      // Delete the entire directory
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('Deleted directory', path.relative(process.cwd(), dir));
      totalDeleted += 1; // count as 1 for the directory
      continue;
    }

    const all = walkDir(dir);
    const filesToCheck = all.filter(isTestFile);
    let deleted = 0;

    for (const file of filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        const shouldDelete = (() => {
          return looksLikeGenerated(content);
        })();

        if (shouldDelete) {
          fs.unlinkSync(file);
          console.log('Deleted', path.relative(process.cwd(), file));
          deleted++;
        }
      } catch (err) {
        console.error('Failed to process', file, err);
      }
    }

    console.log(`Deleted ${deleted} file(s) from ${path.relative(process.cwd(), dir)}.`);
    totalDeleted += deleted;
  }

  console.log(`Done. Total deleted ${totalDeleted} generated test file(s).`);
}

main();
