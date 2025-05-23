const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

async function hashFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');   
    const normalized = content.replace(/\r\n/g, '\n');
    const hash = crypto.createHash('sha1').update(normalized).digest('hex');      
    return hash;
  } catch(e) {   
    return null; // file missing
  }
}

async function status(repoDir = process.cwd()) {
  const gitDir = path.join(repoDir, '.simplegit');
  const indexPath = path.join(gitDir, 'index');
  const headPath = path.join(gitDir, 'HEAD');
  const commitsDir = path.join(gitDir, 'commits');

  let stagedFiles = {}; // { filename: hash }
  let committedFiles = {}; // { filename: hash }

  // Read current index (staging area)
  try {
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    indexContent.trim().split('\n').forEach(line => {
      const [hash, filename] = line.split(' ');
      stagedFiles[filename] = hash;
    });
  } catch {
    console.error('Not a simpleGit repository. Run `simplegit init` first.');
    return;
  }

  // Read last commit's index
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const refMatch = headContent.trim().match(/^ref: (.+)$/);
    const refPath = refMatch
      ? path.join(gitDir, refMatch[1])
      : headPath;

    const commitHash = await fs.readFile(refPath, 'utf-8');
    const commitPath = path.join(commitsDir, commitHash.trim());
    const commitData = await fs.readFile(commitPath, 'utf-8');
    const commit = JSON.parse(commitData);

    commit.index?.split('\n').forEach(line => {
        const [hash, filename] = line.split(' ');
        if (filename && hash) {          
        committedFiles[filename] = hash;
      }
    });
  } catch {
    // No commits yet
  }

  const dirEntries = await fs.readdir(repoDir, { withFileTypes: true });
  const workingFiles = dirEntries
    .filter(entry => entry.isFile() && entry.name !== '.simplegit')
    .map(entry => entry.name);

  const changesToBeCommitted = [];
  const changesNotStaged = [];
  const untracked = [];

  for (const file of workingFiles) {
    const filePath = path.join(repoDir, file);
    const currentHash = await hashFile(filePath);

    const stagedHash = stagedFiles[file];
    const committedHash = committedFiles[file];

    if (stagedHash && stagedHash !== committedHash) {
      changesToBeCommitted.push(file);
    } else if (committedHash) {
      if (currentHash !== committedHash) {       
        changesNotStaged.push(file);
      }
    } else if (!stagedHash) {
      untracked.push(file);
    }
  }

  console.log('On branch master');

  if (changesToBeCommitted.length) {
    console.log('\nChanges to be committed:');
    changesToBeCommitted.forEach(file => console.log(`  modified: ${file}`));
  }

  if (changesNotStaged.length) {
    console.log('\nChanges not staged for commit:');
    changesNotStaged.forEach(file => console.log(`  modified: ${file}`));
  }

  if (untracked.length) {
    console.log('\nUntracked files:');
    untracked.forEach(file => console.log(`  ${file}`));
  }

  if (
    !changesToBeCommitted.length &&
    !changesNotStaged.length &&
    !untracked.length
  ) {
    console.log('\nNothing to commit, working tree clean.');
  }
}

module.exports = { status };
