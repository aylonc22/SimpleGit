const fs = require('fs/promises');
const path = require('path');
const { initRepo } = require('../lib/init');

const TEST_REPO = path.join(__dirname, 'test-repo-init');

beforeEach(async () => {
  await fs.rm(TEST_REPO, { recursive: true, force: true });
});

afterEach(async () => {
  await fs.rm(TEST_REPO, { recursive: true, force: true });
});

test('creates the .simplegit directory structure', async () => {
  await initRepo(TEST_REPO);

  const gitDir = path.join(TEST_REPO, '.simplegit');
  const objectsDir = path.join(gitDir, 'objects');
  const refsDir = path.join(gitDir, 'refs', 'heads');
  const headFile = path.join(gitDir, 'HEAD');

  // Check directories
  await expect(fs.stat(gitDir)).resolves.toBeDefined();
  await expect(fs.stat(objectsDir)).resolves.toBeDefined();
  await expect(fs.stat(refsDir)).resolves.toBeDefined();

  // Check HEAD file contents
  const headContent = await fs.readFile(headFile, 'utf-8');
  expect(headContent.trim()).toBe('ref: refs/heads/master');
});
