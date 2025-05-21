const fs = require('fs/promises');
const path = require('path');
const { commit } = require('../lib/commit');
const { initRepo } = require('../lib/init');

const repoDir = path.join(__dirname, 'test-repo');

beforeEach(async () => {
  await initRepo(repoDir);
  await fs.writeFile(path.join(repoDir, '.simplegit', 'index'), 'fakehash file.txt\n');
});

afterEach(async () => {
  // Cleanup test repo folder
  await fs.rm(repoDir, { recursive: true, force: true });
});

test('commits when index has content and resets index', async () => {
  const indexPath = path.join(repoDir, '.simplegit', 'index');
  const headPath = path.join(repoDir, '.simplegit', 'HEAD');
  const masterRefPath = path.join(repoDir, '.simplegit', 'refs', 'heads', 'master');

  // Spy on console.log
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  await commit('Initial commit', repoDir);

  // Check index reset
  const indexContent = await fs.readFile(indexPath, 'utf-8');
  expect(indexContent).toBe('');

  // Check that master ref updated with a commit hash
  const masterContent = await fs.readFile(masterRefPath, 'utf-8');
  expect(masterContent).toMatch(/^[a-f0-9]{40}$/);

  // Check HEAD file content remains a ref to master
  const headContent = await fs.readFile(headPath, 'utf-8');
  expect(headContent.trim()).toBe('ref: refs/heads/master');

  // Check console.log called with commit hash
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^Committed as [a-f0-9]{40}$/));

  logSpy.mockRestore();
});

test('prevents commit if index is empty', async () => {
  const indexPath = path.join(repoDir, '.simplegit', 'index');
  await fs.writeFile(indexPath, ''); // Empty index

  // Spy on console.error
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await commit('Empty commit', repoDir);

  expect(errorSpy).toHaveBeenCalledWith('Nothing to commit. Index is empty.');

  errorSpy.mockRestore();
});
