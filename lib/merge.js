const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

async function readCommit(commitHash, gitDir) {
  const commitPath = path.join(gitDir, 'commits', commitHash);
  const content = await fs.readFile(commitPath, 'utf8');
  return JSON.parse(content);
}

async function mergeBranches(targetBranch, cwd = process.cwd()) {
  const gitDir = path.join(cwd, '.simplegit');
  const headPath = path.join(gitDir, 'HEAD');

  const headContent = await fs.readFile(headPath, 'utf8');
  const currentRef = headContent.trim().split(' ')[1];
  const currentBranchPath = path.join(gitDir, currentRef);
  const targetBranchPath = path.join(gitDir, 'refs', 'heads', targetBranch);

  try {
    await fs.access(targetBranchPath);
  } catch {
    console.error(`error: Branch '${targetBranch}' does not exist.`);
    return;
  }

  const currentCommitHash = (await fs.readFile(currentBranchPath, 'utf8')).trim();
  const targetCommitHash = (await fs.readFile(targetBranchPath, 'utf8')).trim();

  const currentCommit = await readCommit(currentCommitHash, gitDir);
  const targetCommit = await readCommit(targetCommitHash, gitDir);

  // Parse index of both commits into maps
  const parseIndex = (str) =>
    str.split('\n').filter(Boolean).reduce((map, line) => {
      const [hash, file] = line.split(' ');
      map[file] = hash;
      return map;
    }, {});

  const currentIndexMap = parseIndex(currentCommit.index);
  const targetIndexMap = parseIndex(targetCommit.index);

  // Merge: favor target version if conflict
  const mergedIndexMap = { ...currentIndexMap, ...targetIndexMap };
  const mergedIndexStr = Object.entries(mergedIndexMap)
    .map(([file, hash]) => `${hash} ${file}`)
    .join('\n');

  // Create merge commit
  const author = currentCommit.author;
  const message = `Merge branch '${targetBranch}'`;
  const timestamp = new Date().toISOString();

  const commitObj = {
    message,
    timestamp,
    parent: [currentCommitHash, targetCommitHash],
    index: mergedIndexStr,
    author,
  };

  const commitData = JSON.stringify(commitObj, null, 2);
  const commitHash = crypto.createHash('sha1').update(commitData).digest('hex');

  const commitsDir = path.join(gitDir, 'commits');
  await fs.mkdir(commitsDir, { recursive: true });
  await fs.writeFile(path.join(commitsDir, commitHash), commitData);

  // Update current branch to point to new merge commit
  await fs.writeFile(currentBranchPath, commitHash);

  console.log(`Merged '${targetBranch}' into current branch (${commitHash})`);
}

module.exports = { mergeBranches };
