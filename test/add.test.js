const fs = require('fs/promises');
const path = require('path');
const { add } = require('../lib/add');
const { commit } = require('../lib/commit');
const { setAuthor } = require('../lib/config');
const { initRepo } = require('../lib/init');

const TEST_REPO = path.join(__dirname, 'test-repo-add');

describe('add command', () => { 

  beforeEach(async () => {
    await initRepo(TEST_REPO);
    await setAuthor("test test@test.com",TEST_REPO);
  });

  afterEach(async () => {
    // Clean up temp repo folder after each test
    await fs.rm(TEST_REPO, { recursive: true, force: true });
  });

  test('adds a single file by relative path', async () => {
    const filePath = path.join(TEST_REPO, 'file1.txt');
    await fs.writeFile(filePath, 'Hello World');

    await add('file1.txt', TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);

    // Objects folder should contain the hash file
    const hash = require('crypto').createHash('sha1').update('Hello World').digest('hex');
    const objectPath = path.join(TEST_REPO, '.simplegit', 'objects', hash);
    const objectContent = await fs.readFile(objectPath, 'utf8');
    expect(objectContent).toBe('Hello World');
  });

  test('adds all files non-recursive with *', async () => {
    // Create multiple files and a subdirectory with files
    await fs.writeFile(path.join(TEST_REPO, 'file1.txt'), 'File 1');
    await fs.writeFile(path.join(TEST_REPO, 'file2.txt'), 'File 2');
    await fs.mkdir(path.join(TEST_REPO, 'subdir'));
    await fs.writeFile(path.join(TEST_REPO, 'subdir', 'file3.txt'), 'File 3');

    await add('*', TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);
    expect(index).toMatch(/file2\.txt/);
    expect(index).not.toMatch(/subdir/); // should not add subdirectory files non-recursively
  });

  test('adds all files recursively with .', async () => {
    // Create files and subdirectories recursively
    await fs.writeFile(path.join(TEST_REPO, 'file1.txt'), 'File 1');
    await fs.mkdir(path.join(TEST_REPO, 'subdir'));
    await fs.writeFile(path.join(TEST_REPO, 'subdir', 'file2.txt'), 'File 2');

    await add('.', TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);
    expect(index).toMatch(/subdir\/file2\.txt/);
  });

  test('adds directory recursively by path', async () => {
    await fs.mkdir(path.join(TEST_REPO, 'folder'));
    await fs.writeFile(path.join(TEST_REPO, 'folder', 'file.txt'), 'Folder file');

    await add('folder', TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/folder\/file\.txt/);
  });

  test('handles non-existent path gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await add('nonexistent.file', TEST_REPO);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error accessing path'));
    consoleSpy.mockRestore();
  });

  test('adds file by absolute path', async () => {
    const filePath = path.join(TEST_REPO, 'absfile.txt');
    await fs.writeFile(filePath, 'Absolute file content');

    await add(filePath, TEST_REPO);

    const index = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/absfile\.txt/);
  });

  test('shows message when there is nothing new to add', async () => {
    const filePath = path.join(TEST_REPO, 'file1.txt');
    await fs.writeFile(filePath, 'Hello unchanged world');
  
    // First add
    await add('file1.txt', TEST_REPO);
    await commit('test',TEST_REPO);
    // Capture console output
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    // Try to add again (no change)
    await add('file1.txt', TEST_REPO);
  
    expect(logSpy).toHaveBeenCalledWith(
      'Nothing to add. All files are already staged or unchanged.'
    );
  
    logSpy.mockRestore();
  });

});
