const fs = require('fs/promises');
const path = require('path');
const { initRepo } = require('../lib/init');
const { status } = require('../lib/status');
const { setAuthor } = require('../lib/config');
const { commit } = require('../lib/commit');
const { add } = require('../lib/add');

const repoDir = path.join(__dirname, 'test-repo-status');

beforeEach(async () => {
  await initRepo(repoDir);
  await setAuthor('Test User <test@example.com>', repoDir);
});

afterEach(async () => {
  await fs.rm(repoDir, { recursive: true, force: true });
});

test('status shows clean working tree after init', async () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  await status(repoDir);

  const output = logSpy.mock.calls.map(args => args[0]).join('\n');
  expect(output).toContain('On branch master');
  expect(output).toContain('Nothing to commit, working tree clean.');

  logSpy.mockRestore();
});

test('status shows untracked files', async () => {
  const filePath = path.join(repoDir, 'untracked.txt');
  await fs.writeFile(filePath, 'hello untracked');

  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await status(repoDir);

  const output = logSpy.mock.calls.map(args => args[0]).join('\n');
  expect(output).toContain('Untracked files:');
  expect(output).toContain('untracked.txt');

  logSpy.mockRestore();
});

test('status shows changes to be committed', async () => {
  const fileName = 'file-to-add.txt';
  const filePath = path.join(repoDir, fileName);
  await fs.writeFile(filePath, 'content to add');

  await add(fileName, repoDir);

  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await status(repoDir);

  const output = logSpy.mock.calls.map(args => args[0]).join('\n');
  expect(output).toContain('Changes to be committed:');
  expect(output).toContain(`modified: ${fileName}`);

  logSpy.mockRestore();
});

test('status shows changes not staged for commit', async () => {
  const fileName = 'file-changed.txt';
  const filePath = path.join(repoDir, fileName);
  await fs.writeFile(filePath, 'original content');

  await add(fileName, repoDir);
  await commit('Add file-changed.txt', repoDir);

  // Modify file after commit but without staging
  await fs.writeFile(filePath, 'modified content');

  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await status(repoDir);

  const output = logSpy.mock.calls.map(args => args[0]).join('\n');
  expect(output).toContain('Changes not staged for commit:');
  expect(output).toContain(`modified: ${fileName}`);

  logSpy.mockRestore();
});
