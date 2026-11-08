/** Tiny test helper with no dependencies. Run a file with `node tests/<name>.test.ts`. */
let failed = 0;
let passed = 0;

export function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  ->  ${detail}` : ''}`);
  }
}

export function finish(suite: string): void {
  console.log(`\n${suite}: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
