import fs from "fs";
import path from "path";

const componentsDir = path.join(process.cwd(), "src", "components");

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue; // Skip tests folder
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function isComponentFile(file) {
  return (
    file.endsWith(".tsx") &&
    !file.endsWith(".test.tsx") &&
    !file.endsWith(".spec.tsx")
  );
}

function createTestFor(file) {
  const name = path.basename(file, ".tsx");
  const dir = path.dirname(file);
  const testsDir = path.join(dir, "__tests__");
  const testPath = path.join(testsDir, `${name}.test.tsx`);
  const importPath = `../${path.basename(file, ".tsx")}`;
  const toastProviderPath = path
    .relative(testsDir, path.join(process.cwd(), "src", "contexts", "ToastContext"))
    .replaceAll("\\", "/");

  const template = `// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test\nimport { render } from '@testing-library/react';\nimport { describe, it, expect, beforeEach, vi } from 'vitest';\nimport { MemoryRouter } from 'react-router-dom';\nimport { ToastProvider } from '${toastProviderPath}';\nimport ${name} from '${importPath}';\n\nfunction renderWithProviders(ui) {\n  return render(\n    <MemoryRouter>\n      <ToastProvider>{ui}</ToastProvider>\n    </MemoryRouter>\n  );\n}\n\ndescribe('${name}', () => {\n  beforeEach(() => {\n    vi.clearAllMocks();\n  });\n\n  it('renders without crashing', () => {\n    // Provide required props if the component expects them.\n    const props = {} as any;\n    const { container } = renderWithProviders(<${name} {...props} />);\n    expect(container.firstChild).toBeTruthy();\n  });\n});\n`;

  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // if test exists, only overwrite if it's an old auto-generated test
  if (fs.existsSync(testPath)) {
    const existing = fs.readFileSync(testPath, "utf8");
    if (
      /AUTO-GENERATED TEST/.test(existing) ||
      /renders without crashing/.test(existing) ||
      /expect\(container\)\.toBeDefined\(\)/.test(existing)
    ) {
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
    console.error("Components directory not found:", componentsDir);
    process.exit(1);
  }

  const all = walkDir(componentsDir);
  const comps = all.filter(isComponentFile);
  let created = 0;

  for (const file of comps) {
    try {
      if (createTestFor(file)) {
        console.log("Created test for", path.relative(process.cwd(), file));
        created++;
      }
    } catch (err) {
      console.error("Failed for", file, err);
    }
  }

  console.log(`Done. Created ${created} test file(s).`);
}

main();
