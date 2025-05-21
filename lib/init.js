const fs = require('fs/promises');
const path = require('path');

async function initRepo(cwd = process.cwd()) {
  const gitDir = path.join(cwd, '.simplegit');

  try {
    await fs.mkdir(path.join(gitDir, 'objects'), { recursive: true });
    await fs.mkdir(path.join(gitDir, 'refs', 'heads'), { recursive: true });

    await fs.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/master\n');
    await fs.writeFile(path.join(gitDir, 'refs', 'heads', 'master'), '');
    await fs.writeFile(path.join(gitDir, 'index'), '');

    console.log('Initialized empty simpleGit repository in .simplegit');
  } catch (err) {
    console.error('Failed to initialize repository:', err.message);
  }
}

module.exports = { initRepo };
