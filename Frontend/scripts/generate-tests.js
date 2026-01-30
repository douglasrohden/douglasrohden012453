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

  const template = `// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test\nimport { render, screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { vi, describe, it, expect, beforeEach } from 'vitest';\nimport ${name} from '${importPath}';\n\n// Add provider wrappers or mocks below if your component depends on context/hooks/services\n\ndescribe('${name}', () => {\n  beforeEach(() => {\n    vi.clearAllMocks();\n  });\n\n  it('renders default structure', () => {\n    const { container } = render(<${name} />);\n    expect(container.firstChild).toBeTruthy();\n  });\n\n  it.skip('handles a basic user interaction', async () => {\n    const user = userEvent.setup();\n    render(<${name} />);\n    // TODO: replace this with a real interaction/assertion for ${name}\n    await user.keyboard(' ');\n    expect(document.body).toBeDefined();\n  });\n\n  it.skip('responds to prop changes', () => {\n    // TODO: replace exampleProp with a real prop\n    const { rerender } = render(<${name} /* exampleProp=\"initial\" */ />);\n    rerender(<${name} /* exampleProp=\"updated\" */ />);\n    expect(true).toBe(true);\n  });\n\n  it.skip('invokes callback props', async () => {\n    const onAction = vi.fn();\n    const user = userEvent.setup();\n    render(<${name} /* onAction={onAction} */ />);\n    // TODO: trigger UI that should call onAction\n    await user.keyboard(' ');\n    expect(onAction).not.toBeCalled();\n  });\n});\n`;

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
