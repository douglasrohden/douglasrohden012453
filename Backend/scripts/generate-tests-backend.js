import fs from 'fs';
import path from 'path';

const mainJavaDir = path.join(process.cwd(), 'src', 'main', 'java');
const testJavaDir = path.join(process.cwd(), 'src', 'test', 'java');

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else files.push(full);
  }
  return files;
}

function isJavaClassFile(file) {
  return file.endsWith('.java') && !file.endsWith('Test.java');
}

function relativeTestPath(mainFile) {
  const rel = path.relative(mainJavaDir, mainFile);
  const testFile = rel.replace(/\.java$/, 'Test.java');
  return path.join(testJavaDir, testFile);
}

function getPackageFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/package\s+([a-zA-Z0-9_.]+);/);
  return match ? match[1] : '';
}

function getClassNameFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/class\s+(\w+)/);
  return match ? match[1] : path.basename(file, '.java');
}

function getClassType(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (/@Repository/.test(content)) return 'repository';
  if (/@Service/.test(content)) return 'service';
  if (/@Controller|@RestController/.test(content)) return 'controller';
  if (/@Component/.test(content)) return 'component';
  return 'other';
}

function scenarioComment(typeLabel, className) {
  switch (typeLabel) {
    case 'repository':
      return `// TODO: persist a ${className.replace('Repository', '').replace(/([A-Z])/g, ' $1').trim()} entity and assert it can be read back\n            // Example: repository.save(entity); assertThat(repository.findAll()).isNotEmpty();`;
    case 'service':
      return `// TODO: wire ${className} with mocks and assert behaviour\n            // Example: when(dependency.method()).thenReturn(...);`;
    case 'controller':
      return `// TODO: exercise controller endpoint with MockMvc/WebTestClient and assert status/body`;
    default:
      return `// TODO: add real scenario for ${className}`;
  }
}

function createTestFor(file) {
  const testPath = relativeTestPath(file);
  const packageName = getPackageFromFile(file);
  const className = getClassNameFromFile(file);
  const testClassName = className + 'Test';
  const classType = getClassType(file);
  const packageLine = packageName ? `package ${packageName};\n\n` : '';
  const fqn = packageName ? `${packageName}.${className}` : className;
  const typeLabel = classType === 'other' ? 'component' : classType;
  const scenarioHint = scenarioComment(typeLabel, className);

  const template = `${packageLine}import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@DisplayName("${className} ${typeLabel} tests")
class ${testClassName} {

    @Test
    @DisplayName("loads ${className} via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("${fqn}"));
    }

    @Nested
    @DisplayName("scenarios to implement for ${typeLabel}")
    class Scenarios {

        @Test
        @Disabled("Replace with a real happy-path test")
        void happyPath() {
            ${scenarioHint}
            assertTrue(true); // placeholder
        }

        @Test
        @Disabled("Replace with an edge case test")
        void handlesEdgeCases() {
            ${scenarioHint}
            assertTrue(true); // placeholder
        }
    }
}
`;

  if (fs.existsSync(testPath)) {
    const existing = fs.readFileSync(testPath, 'utf8');
    // Only overwrite if previously generated or placeholder-ish
    if (!/AUTO-GENERATED TEST|classCompiles|basicSmokeTest/.test(existing)) {
      return false;
    }
  }

  const dir = path.dirname(testPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(testPath, template);
  return true;
}

function main() {
  if (!fs.existsSync(mainJavaDir)) {
    console.error('Main Java directory not found:', mainJavaDir);
    process.exit(1);
  }

  const all = walkDir(mainJavaDir);
  const classes = all.filter(isJavaClassFile);
  let created = 0;

  for (const file of classes) {
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
