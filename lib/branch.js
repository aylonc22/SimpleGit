const fs = require('fs/promises');
const path = require('path');

async function createBranch(branchName, cwd = process.cwd()) {
  const gitDir = path.join(cwd, '.simplegit');
  const headPath = path.join(gitDir, 'HEAD');

  // Read current HEAD
  const headContent = await fs.readFile(headPath, 'utf-8');
  const currentBranchRef = headContent.trim().split(' ')[1];
  const currentBranchPath = path.join(gitDir, currentBranchRef);

  // Get current commit hash
  const currentCommit = await fs.readFile(currentBranchPath, 'utf-8');

  // Create new branch ref file and write current commit
  const newBranchPath = path.join(gitDir, 'refs', 'heads', branchName);
  await fs.mkdir(path.dirname(newBranchPath), { recursive: true });
  await fs.writeFile(newBranchPath, currentCommit.trim());

  console.log(`Branch '${branchName}' created at ${currentCommit.trim()}`);
}


async function checkoutBranch(branchName, cwd = process.cwd()) {
    const gitDir = path.join(cwd, '.simplegit');
    const branchPath = path.join(gitDir, 'refs', 'heads', branchName);
  
    try {
      await fs.access(branchPath);
    } catch {
      console.error(`Branch '${branchName}' does not exist.`);
      return;
    }
  
    const headPath = path.join(gitDir, 'HEAD');
    await fs.writeFile(headPath, `ref: refs/heads/${branchName}`);
    console.log(`Switched to branch '${branchName}'`);
  }

  async function getCurrentBranch(cwd = process.cwd()) {
    const gitDir = path.join(cwd, '.simplegit');
    const headPath = path.join(gitDir, 'HEAD');
  
    try {
      const headContent = await fs.readFile(headPath, 'utf-8');
      const match = headContent.trim().match(/^ref: refs\/heads\/(.+)$/);
      if (match) {
        return match[1];
      }
      // Detached HEAD or unexpected format
      return null;
    } catch {
      // HEAD file missing or unreadable
      return null;
    }
  }

  
  module.exports = { createBranch, checkoutBranch, getCurrentBranch }