const fs = require('fs/promises');
const path = require('path');
const { initRepo } = require('../lib/init');
const { createBranch, checkoutBranch, getCurrentBranch } = require('../lib/branch');

const TEST_REPO = path.join(__dirname, 'test-repo-branch');

describe('branch commands', () => {
  beforeEach(async () => {
    await initRepo(TEST_REPO);
  });

  afterEach(async () => {
    await fs.rm(TEST_REPO, { recursive: true, force: true });
  });

  test('create a new branch', async () => {
    await createBranch('feature', TEST_REPO);

    const branchFile = path.join(TEST_REPO, '.simplegit', 'refs', 'heads', 'feature');
    const exists = await fs.stat(branchFile).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  test('HEAD does not change after branch creation', async () => {
    await createBranch('feature', TEST_REPO);

    const headContent = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'HEAD'), 'utf-8');
    expect(headContent.trim()).toBe('ref: refs/heads/master');  // assuming master is default branch
  });

  test('checkout switches HEAD to given branch', async () => {
    await createBranch('feature', TEST_REPO);
    await checkoutBranch('feature', TEST_REPO);

    const headContent = await fs.readFile(path.join(TEST_REPO, '.simplegit', 'HEAD'), 'utf-8');
    expect(headContent.trim()).toBe('ref: refs/heads/feature');
  });

  test('getCurrentBranch returns the active branch name', async () => {
    await createBranch('feature', TEST_REPO);
    await checkoutBranch('feature', TEST_REPO);

    const branchName = await getCurrentBranch(TEST_REPO);
    expect(branchName).toBe('feature');
  });
});
