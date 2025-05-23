const fs = require('fs/promises');
const path = require('path');
const { initRepo } = require('../lib/init');
const { setAuthor } = require('../lib/config');
const { commit } = require('../lib/commit');
const { createBranch, checkoutBranch } = require('../lib/branch');
const { mergeBranches } = require('../lib/merge');
const { rmSync } = require('fs');

describe('mergeBranches', () => {
  let repoDir;

  beforeEach(async () => {
    repoDir = path.join(__dirname, 'test-repo-merge');
    await initRepo(repoDir);
    await setAuthor('Tester <test@example.com>', repoDir);
  });

  afterEach(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  test('merges feature branch into master and creates a merge commit', async () => {
    const gitDir = path.join(repoDir, '.simplegit');
    const indexPath = path.join(gitDir, 'index');
    const masterRef = path.join(gitDir, 'refs', 'heads', 'master');

    // Commit 1 on master
    await fs.writeFile(indexPath, 'hash1 file1.txt\n');
    await commit('Initial commit', repoDir);
    const firstCommit = (await fs.readFile(masterRef, 'utf8')).trim();

    // Create and checkout feature branch
    await createBranch('feature', repoDir);
    await checkoutBranch('feature', repoDir);

    // Commit 2 on feature branch
    await fs.writeFile(indexPath, 'hash2 file2.txt\n');
    await commit('Feature work', repoDir);
    const featureCommit = (await fs.readFile(path.join(gitDir, 'refs', 'heads', 'feature'), 'utf8')).trim();

    // Switch back to master
    await checkoutBranch('master', repoDir);

    // Merge feature into master
    await mergeBranches('feature', repoDir);

    // Get new HEAD commit
    const mergedCommit = (await fs.readFile(masterRef, 'utf8')).trim();
    expect(mergedCommit).not.toBe(firstCommit);
    expect(mergedCommit).not.toBe(featureCommit);

    // Check merged commit content
    const commitPath = path.join(gitDir, 'commits', mergedCommit);
    const commitData = JSON.parse(await fs.readFile(commitPath, 'utf8'));

    expect(commitData.message).toContain("Merge branch 'feature'");
    expect(commitData.parent).toEqual([firstCommit, featureCommit]);

    // Check that merged index contains both files
    expect(commitData.index).toContain('file1.txt');
    expect(commitData.index).toContain('file2.txt');
  });
});
