import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else files.push(full);
  }
  return files;
}

function isComponentFile(file) {
  return file.endsWith('.tsx') && !file.endsWith('.test.tsx') && !file.endsWith('.spec.tsx');
}

function relativeImport(from, to) {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.tsx?$/, '');
}

function createTestFor(file) {
  const name = path.basename(file, '.tsx');
  const testPath = file.replace(/\.tsx$/, '.test.tsx');
  const importPath = './' + path.basename(file);

  // richer template inspired by CreateAlbumForm.test.tsx
  const template = `// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test\nimport { render, screen, waitFor } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { vi, describe, it, expect, beforeEach } from 'vitest';\nimport ${name} from '${importPath}';\n\n// Add provider wrappers or mocks below if your component depends on context/hooks/services\n\ndescribe('${name}', () => {\n  beforeEach(() => {\n    vi.clearAllMocks();\n  });\n\n  it('basic smoke and interaction example', async () => {\n    const user = userEvent.setup();\n    render(<${name} />);\n    // Replace with proper assertions for ${name}\n    expect(screen.getByRole ? screen.getByRole('region') : document.body).toBeDefined();\n  });\n});\n`;

  // if test exists, only overwrite if it's an old auto-generated test
  if (fs.existsSync(testPath)) {
    const existing = fs.readFileSync(testPath, 'utf8');
    if (/AUTO-GENERATED TEST/.test(existing) || /renders without crashing/.test(existing) || /expect\(container\)\.toBeDefined\(\)/.test(existing)) {
      fs.writeFileSync(testPath, template);
      return true; // treated as updated
    }
    return false; // skip non-generated tests
  }

  fs.writeFileSync(testPath, template);
  return true;
}

function main() {
  if (!fs.existsSync(componentsDir)) {
    console.error('Components directory not found:', componentsDir);
    process.exit(1);
  }

  const all = walkDir(componentsDir);
  const comps = all.filter(isComponentFile);
  let created = 0;

  for (const file of comps) {
    try {
      if (createTestFor(file)) {
        console.log('Created test for', path.relative(process.cwd(), file));
        created++;
      }
    } catch (err) {
      console.error('Failed for', file, err);
    }
  }

  console.log(`Done. Created ${created} test file(s).`);
}

main();
