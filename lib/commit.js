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

  // Get parent commit (if any)
  let parent = null;
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const refMatch = headContent.match(/^ref: (.+)$/);
    if (refMatch) {
      const refPath = path.join(gitDir, refMatch[1]);
      parent = await fs.readFile(refPath, 'utf-8');
    } else {
      parent = headContent.trim();
    }
  } catch {
    // No HEAD yet, this is likely the first commit
  }

  const timestamp = new Date().toISOString();
  const commitObject = {
    message,
    timestamp,
    parent: parent?.trim() || null,
    index: indexContent.trim(),
  };

  const commitData = JSON.stringify(commitObject, null, 2);
  const commitHash = crypto.createHash('sha1').update(commitData).digest('hex');

  await fs.mkdir(commitsDir, { recursive: true });
  const commitFilePath = path.join(commitsDir, commitHash);
  await fs.writeFile(commitFilePath, commitData);

  // Update branch ref or HEAD with new commit hash
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const refMatch = headContent.match(/^ref: (.+)$/);
    if (refMatch) {
      const refPath = path.join(gitDir, refMatch[1]);
      await fs.writeFile(refPath, commitHash);
    } else {
      await fs.writeFile(headPath, commitHash);
    }
  } catch (err) {
    // If HEAD is missing or invalid, write directly to HEAD
    await fs.writeFile(headPath, commitHash);
  }

  // **RESET the index after commit**
  await fs.writeFile(indexPath, '');

  console.log(`Committed as ${commitHash}`);
}

module.exports = { commit };
