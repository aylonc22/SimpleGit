const fs = require('fs/promises');
const path = require('path');
const { setAuthor, getAuthor } = require('../lib/config');

const repoDir = path.join(__dirname, 'test-repo-config');

beforeEach(async () => {
  // Clean up and recreate test repo folder
  await fs.rm(repoDir, { recursive: true, force: true });
  await fs.mkdir(path.join(repoDir, '.simplegit'), { recursive: true });
});

afterEach(async () => {
  // Clean up after tests
  await fs.rm(repoDir, { recursive: true, force: true });
});

test('setAuthor writes author to config file', async () => {
  const author = 'Jane Doe <jane@example.com>';
  await setAuthor(author, repoDir);

  // Read config file manually to verify
  const configPath = path.join(repoDir, '.simplegit', 'config');
  const data = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(data);

  expect(config.author).toBe(author);
});

test('getAuthor returns correct author from config', async () => {
  const author = 'John Smith <john@example.com>';
  // Setup config manually
  const configPath = path.join(repoDir, '.simplegit', 'config');
  await fs.writeFile(configPath, JSON.stringify({ author }, null, 2));

  const readAuthor = await getAuthor(repoDir);
  expect(readAuthor).toBe(author);
});

test('getAuthor returns null if config missing or no author', async () => {
  // No config file
  let readAuthor = await getAuthor(repoDir);
  expect(readAuthor).toBeNull();

  // Empty config file
  const configPath = path.join(repoDir, '.simplegit', 'config');
  await fs.writeFile(configPath, JSON.stringify({}, null, 2));
  readAuthor = await getAuthor(repoDir);
  expect(readAuthor).toBeNull();
});
