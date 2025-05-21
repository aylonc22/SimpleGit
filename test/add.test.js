const fs = require('fs/promises');
const path = require('path');
const { add } = require('../lib/add');

async function setupTempRepo() {
  const TEST_REPO = path.join(__dirname, 'test-repo-add');
  // Initialize .simplegit structure (like initRepo does)
  const gitDir = path.join(TEST_REPO, '.simplegit');
  await fs.mkdir(path.join(gitDir, 'objects'), { recursive: true });
  await fs.mkdir(path.join(gitDir, 'refs', 'heads'), { recursive: true });
  await fs.writeFile(path.join(gitDir, 'HEAD'), 'refs/heads/master\n');
  await fs.writeFile(path.join(gitDir, 'refs', 'heads', 'master'), '');
  await fs.writeFile(path.join(gitDir, 'index'), '');
  return TEST_REPO;
}

describe('add command', () => {
  let repoDir;

  beforeEach(async () => {
    repoDir = await setupTempRepo();
  });

  afterEach(async () => {
    // Clean up temp repo folder after each test
    await fs.rm(repoDir, { recursive: true, force: true });
  });

  test('adds a single file by relative path', async () => {
    const filePath = path.join(repoDir, 'file1.txt');
    await fs.writeFile(filePath, 'Hello World');

    await add('file1.txt', repoDir);

    const index = await fs.readFile(path.join(repoDir, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);

    // Objects folder should contain the hash file
    const hash = require('crypto').createHash('sha1').update('Hello World').digest('hex');
    const objectPath = path.join(repoDir, '.simplegit', 'objects', hash);
    const objectContent = await fs.readFile(objectPath, 'utf8');
    expect(objectContent).toBe('Hello World');
  });

  test('adds all files non-recursive with *', async () => {
    // Create multiple files and a subdirectory with files
    await fs.writeFile(path.join(repoDir, 'file1.txt'), 'File 1');
    await fs.writeFile(path.join(repoDir, 'file2.txt'), 'File 2');
    await fs.mkdir(path.join(repoDir, 'subdir'));
    await fs.writeFile(path.join(repoDir, 'subdir', 'file3.txt'), 'File 3');

    await add('*', repoDir);

    const index = await fs.readFile(path.join(repoDir, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);
    expect(index).toMatch(/file2\.txt/);
    expect(index).not.toMatch(/subdir/); // should not add subdirectory files non-recursively
  });

  test('adds all files recursively with .', async () => {
    // Create files and subdirectories recursively
    await fs.writeFile(path.join(repoDir, 'file1.txt'), 'File 1');
    await fs.mkdir(path.join(repoDir, 'subdir'));
    await fs.writeFile(path.join(repoDir, 'subdir', 'file2.txt'), 'File 2');

    await add('.', repoDir);

    const index = await fs.readFile(path.join(repoDir, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/file1\.txt/);
    expect(index).toMatch(/subdir\/file2\.txt/);
  });

  test('adds directory recursively by path', async () => {
    await fs.mkdir(path.join(repoDir, 'folder'));
    await fs.writeFile(path.join(repoDir, 'folder', 'file.txt'), 'Folder file');

    await add('folder', repoDir);

    const index = await fs.readFile(path.join(repoDir, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/folder\/file\.txt/);
  });

  test('handles non-existent path gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await add('nonexistent.file', repoDir);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error accessing path'));
    consoleSpy.mockRestore();
  });

  test('adds file by absolute path', async () => {
    const filePath = path.join(repoDir, 'absfile.txt');
    await fs.writeFile(filePath, 'Absolute file content');

    await add(filePath, repoDir);

    const index = await fs.readFile(path.join(repoDir, '.simplegit', 'index'), 'utf8');
    expect(index).toMatch(/absfile\.txt/);
  });
});
