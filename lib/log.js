const fs = require('fs/promises');
const path = require('path');

async function log(repoDir = process.cwd()) {
  const gitDir = path.join(repoDir, '.simplegit');
  const headPath = path.join(gitDir, 'HEAD');
  
  const headContent = (await fs.readFile(headPath, 'utf-8')).trim();
  const refMatch = headContent.match(/^ref: (.+)$/);
  if (!refMatch) {
    console.error('HEAD is detached or invalid');
    return;
  }

  let refPath = path.join(gitDir, refMatch[1]);
  let commitHash = (await fs.readFile(refPath, 'utf-8')).trim();

  if (!commitHash) {
    console.log('No commits yet.');
    return;
  }

  while (commitHash) {
    const commitPath = path.join(gitDir, 'commits', commitHash);
    const commitDataRaw = await fs.readFile(commitPath, 'utf-8');
    // Assuming commitDataRaw is JSON with parent, message, author, date fields
    const commitData = JSON.parse(commitDataRaw);

    console.log(`commit ${commitHash}`);
    console.log(`Author: ${commitData.author}`);
    console.log(`Date:   ${commitData.timestamp}`);
    console.log('');
    console.log(`    ${commitData.message}`);
    console.log('');

    commitHash = commitData.parent || null;
  }
}

module.exports = { log };
