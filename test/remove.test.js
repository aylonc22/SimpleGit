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
   // await fs.rm(TEST_REPO, { recursive: true, force: true });
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
    console.log(index)
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

});
