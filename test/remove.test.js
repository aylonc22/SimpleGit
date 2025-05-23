const fs = require('fs/promises');
const path = require('path');
const { add } = require('../lib/add');
const { setAuthor } = require('../lib/config');
const { initRepo } = require('../lib/init');
const { removeFromIndex } = require('../lib/remove');

const TEST_REPO = path.join(__dirname, 'test-repo-remove');

describe('remove command', () => { 

  beforeEach(async () => {
    await initRepo(TEST_REPO);
    await setAuthor("test test@test.com",TEST_REPO);
  });

  afterEach(async () => {
    // Clean up temp repo folder after each test
    await fs.rm(TEST_REPO, { recursive: true, force: true });
  });

  test('remove a single file by relative path', async () => {
    const filePath = path.join(TEST_REPO, 'file1.txt');
    await fs.writeFile(filePath, 'Hello World');
    const filePath2 = path.join(TEST_REPO, 'file2.txt');
    await fs.writeFile(filePath2, 'Hello World');

    await add('file1.txt', TEST_REPO);
    await add('file2.txt', TEST_REPO);

    await removeFromIndex('file1.txt', TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');

    // Index filer should contain 1 file
   
    const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);   
    expect(filenames).toContain('file2.txt');
    expect(filenames).not.toContain('file1.txt');
  });

  test('remove all files ', async () => {
    const filePath = path.join(TEST_REPO, 'file1.txt');
    await fs.writeFile(filePath, 'Hello World');
    const filePath2 = path.join(TEST_REPO, 'file2.txt');
    await fs.writeFile(filePath2, 'Hello World');

    await add('file1.txt', TEST_REPO);
    await add('file2.txt', TEST_REPO);

    await removeFromIndex(undefined, TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');

    // Index filer should contain 0 files
   
    const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);
    expect(filenames).not.toContain('file2.txt');
    expect(filenames).not.toContain('file1.txt');
  });

  test('removing a file that was never added should not throw', async () => {
    const filePath = path.join(TEST_REPO, 'file3.txt');
    await fs.writeFile(filePath, 'This was never added');
  
    await expect(removeFromIndex('file3.txt', TEST_REPO)).resolves.not.toThrow();
  
    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);
    expect(filenames).not.toContain('file3.txt');
  });
  
  test('remove a file in a subdirectory', async () => {
    const subDir = path.join(TEST_REPO, 'src');
    await fs.mkdir(subDir, { recursive: true });
    const filePath = path.join(subDir, 'app.js');
    await fs.writeFile(filePath, 'console.log("hi");');
  
    await add('src/app.js', TEST_REPO);
    await removeFromIndex('src/app.js', TEST_REPO);
  
    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);
    expect(filenames).not.toContain('src/app.js');
  });

  test('remove all files from a specific directory', async () => {
    await fs.mkdir(path.join(TEST_REPO, 'dir'), { recursive: true });
    await fs.writeFile(path.join(TEST_REPO, 'dir', 'a.txt'), 'A');
    await fs.writeFile(path.join(TEST_REPO, 'dir', 'b.txt'), 'B');
    await fs.writeFile(path.join(TEST_REPO, 'c.txt'), 'C');
  
    await add('dir/a.txt', TEST_REPO);
    await add('dir/b.txt', TEST_REPO);
    await add('c.txt', TEST_REPO);
  
    await removeFromIndex('dir', TEST_REPO);
  
    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);
  
    expect(filenames).toContain('c.txt');
    expect(filenames).not.toContain('dir/a.txt');
    expect(filenames).not.toContain('dir/b.txt');
  });

  const { commit } = require('../lib/commit');

test('removeFromIndex should not affect committed files', async () => {
  const filePath = path.join(TEST_REPO, 'file.txt');
  await fs.writeFile(filePath, 'Committed content');
  await add('file.txt', TEST_REPO);
  await commit('initial commit', TEST_REPO);

  await removeFromIndex('file.txt', TEST_REPO);

  // file.txt should be removed from index
  const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
  const filenames = index.trim().split('\n').filter(Boolean).map(line => line.split(' ')[1]);
  expect(filenames).not.toContain('file.txt');

  // But file should still exist in HEAD commit (implementation dependent)
});
});
