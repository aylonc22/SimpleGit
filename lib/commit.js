const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { getAuthor } = require('./config');

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

  const author = await getAuthor(cwd);
  if (!author) {
    console.error('No author configured. Please run `simplegit config --author "Your Name <email>"` first.');
    return;
  }

  // Prevent empty commits
  const indexContent = await fs.readFile(indexPath, 'utf-8');
  if (!indexContent.trim()) {
    console.error('Nothing to commit. Index is empty.');
    return;
  }

  // Read HEAD to find current branch ref
  let branchRef;
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const refMatch = headContent.trim().match(/^ref: (.+)$/);
    if (!refMatch) {
      console.error('HEAD is not pointing to a branch. Detached HEAD state is not supported.');
      return;
    }
    branchRef = refMatch[1];
  } catch {
    console.error('HEAD file missing or unreadable.');
    return;
  }

  // Get parent commit hash from branch ref (if exists)
  let parent = null;
  let parentIndexMap = {};
  const branchRefPath = path.join(gitDir, branchRef);
  try {
    parent = (await fs.readFile(branchRefPath, 'utf-8')).trim();
    if (parent === '') parent = null; // no commits yet
    else{
      // 1. Load parent's commit index (if parent exists)
      const parentCommitFile = path.join(commitsDir, parent);
      const parentCommitContent = await fs.readFile(parentCommitFile, 'utf-8');
      const parentCommit = JSON.parse(parentCommitContent);
      parentCommit.index.split('\n').forEach(line => {
      if (!line.trim()) return;
      const [hash, filename] = line.split(' ');
      if (hash && filename) parentIndexMap[filename] = hash;
  });
    }
  } catch (e){
    // Branch ref does not exist yet (first commit)   
    parent = null;
  }

  const timestamp = new Date().toISOString();

  // 2. Load current staged index into a map
  const currentIndexMap = {};
  indexContent.split('\n').forEach(line => {
    if (!line.trim()) return;
    const [hash, filename] = line.split(' ');
    if (hash && filename) currentIndexMap[filename] = hash;
  });

  // 3. Merge current staged into parent tree
  const mergedIndexMap = { ...parentIndexMap, ...currentIndexMap };

  // 4. Convert mergedIndexMap back to string for commit object
  const mergedIndexString = Object.entries(mergedIndexMap)
    .map(([filename, hash]) => `${hash} ${filename}`)
    .join('\n');

  // Create commit object including parent, author, message, timestamp, and index snapshot
  const commitObject = {
    message,
    timestamp,
    parent,
    index: mergedIndexString,
    author,
  };

  const commitData = JSON.stringify(commitObject, null, 2);
  const commitHash = crypto.createHash('sha1').update(commitData).digest('hex');

  // Write commit object file
  await fs.mkdir(commitsDir, { recursive: true });
  const commitFilePath = path.join(commitsDir, commitHash);
  await fs.writeFile(commitFilePath, commitData);

  // Update the branch ref to point to the new commit hash
  await fs.writeFile(branchRefPath, commitHash);

  // Reset the index file after commit
  await fs.writeFile(indexPath, '');

  console.log(`Committed as ${commitHash}`);
}

module.exports = { commit };
