const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

async function commit(message, cwd = process.cwd()) {
  const gitDir = path.join(cwd, '.simplegit');
  const indexPath = path.join(gitDir, 'index');
  const commitsDir = path.join(gitDir, 'commits');
  const headPath = path.join(gitDir, 'HEAD');

  // Ensure repository is initialized
  try {
    await fs.access(indexPath);
  } catch {
    console.error('Not a simpleGit repository. Run `simplegit init` first.');
    return;
  }

  // Prevent empty commits
  const indexContent = await fs.readFile(indexPath, 'utf-8');
  if (!indexContent.trim()) {
    console.error('Nothing to commit. Index is empty.');
    return;
  }

  // Read HEAD ref
  let headRef;
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const match = headContent.trim().match(/^ref: (.+)$/);
    if (!match) {
      console.error('Invalid HEAD file. Expected format: ref: <branch>');
      return;
    }
    headRef = match[1];
  } catch {
    console.error('HEAD not found. Did you run `simplegit init`?');
    return;
  }

  const refPath = path.join(gitDir, headRef);

  // Get parent commit hash (if exists)
  let parent = null;
  try {
    const parentHash = await fs.readFile(refPath, 'utf-8');
    parent = parentHash.trim() || null;
  } catch {
    // No previous commit, first commit
  }

  const timestamp = new Date().toISOString();
  const commitObject = {
    message,
    timestamp,
    parent,
    index: indexContent.trim(),
  };

  const commitData = JSON.stringify(commitObject, null, 2);
  const commitHash = crypto.createHash('sha1').update(commitData).digest('hex');

  await fs.mkdir(commitsDir, { recursive: true });
  const commitFilePath = path.join(commitsDir, commitHash);
  await fs.writeFile(commitFilePath, commitData);

  // Update refs/heads/master with new commit hash
  await fs.mkdir(path.dirname(refPath), { recursive: true });
  await fs.writeFile(refPath, commitHash);

  console.log(`Committed as ${commitHash}`);
}

module.exports = { commit };
