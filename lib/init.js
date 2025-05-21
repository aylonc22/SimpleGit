const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

async function initRepo(cwd = process.cwd()) {
  
  const gitDir = path.join(cwd, '.simplegit');
  
  if(fs.existsSync(gitDir)){
      console.error('simpleGit is already initialized in your repository');
      return;
  }

  try {   
    await fsp.mkdir(path.join(gitDir, 'objects'), { recursive: true });
    await fsp.mkdir(path.join(gitDir, 'refs', 'heads'), { recursive: true });

    await fsp.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/master\n');
    await fsp.writeFile(path.join(gitDir, 'refs', 'heads', 'master'), '');
    await fsp.writeFile(path.join(gitDir, 'index'), '');

    console.log('Initialized empty simpleGit repository in .simplegit');
  } catch (err) {
    console.error('Failed to initialize repository:', err.message);
  }
}

module.exports = { initRepo };
