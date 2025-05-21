const fs = require('fs/promises');
const path = require('path');
const { initRepo } = require('../lib/init');
const { commit } = require('../lib/commit');
const { log } = require('../lib/log'); // your log command function
const { setAuthor } = require('../lib/config');

const repoDir = path.join(__dirname, 'test-repo-log');

beforeEach(async () => {
  await initRepo(repoDir);
  // Set author for commit
  await setAuthor('Test User <test@example.com>', repoDir);
});

afterEach(async () => {
  // Cleanup test repo folder
  await fs.rm(repoDir, { recursive: true, force: true });
});

test('log prints commits in reverse chronological order', async () => {
  // Spy on console.log to capture output
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  // Create multiple commits
  await fs.writeFile(path.join(repoDir, '.simplegit', 'index'), 'file1.txt\n');
  await commit('First commit', repoDir);

  await fs.writeFile(path.join(repoDir, '.simplegit', 'index'), 'file2.txt\n');
  await commit('Second commit', repoDir);

  await log(repoDir);

  // Capture all console.log calls as a single string
  const output = logSpy.mock.calls.map(args => args[0]).join('\n');

  // We expect "Second commit" to appear before "First commit"
  const secondIndex = output.indexOf('Second commit');
  const firstIndex = output.indexOf('First commit');

  expect(secondIndex).toBeGreaterThan(-1);
  expect(firstIndex).toBeGreaterThan(-1);
  expect(secondIndex).toBeLessThan(firstIndex); // second commit appears before first in output

  logSpy.mockRestore();
});

test('log prints message when no commits', async () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  await log(repoDir);

  expect(logSpy).toHaveBeenCalledWith('No commits yet.');

  logSpy.mockRestore();
});
