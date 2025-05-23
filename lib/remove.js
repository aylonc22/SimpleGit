const fs = require('fs/promises');
const path = require('path');

async function removeFromIndex(targetPath = undefined, cwd = process.cwd()) {
     const gitDir = path.join(cwd, '.simplegit');
    const indexPath = path.join(gitDir, 'index');
    
    let indexMap = {};
  
    try {
      const currentIndex = await fs.readFile(indexPath, 'utf-8');
      currentIndex.trim().split('\n').forEach(line => {       
        const [filehash, filename] = line.split(' ');
        if (filename && filehash) indexMap[filename] = filehash;
      });
    } catch {
      // No index yet, ignore
      return;
    }
  
    if (!targetPath) {
      // Unstage everything
      indexMap = {};
    } else {
      // Normalize slashes for cross-platform support
      const normalizedTarget = path.normalize(targetPath);
  
      // Remove entries matching file or directory prefix
      for (const filename of Object.keys(indexMap)) {
        const normalizedFilename = path.normalize(filename);
        if (
          normalizedFilename === normalizedTarget ||                   // exact file match
          normalizedFilename.startsWith(normalizedTarget + path.sep)   // directory match
        ) {
          delete indexMap[filename];
        }
      }
    }
  
    // Write back the updated index   
    const updatedIndexContent = Object.entries(indexMap)
      .map(([filename, filehash]) => `${filehash} ${filename}`)
      .join('\n') + '\n';      
  
    await fs.writeFile(indexPath, updatedIndexContent);
  }

  module.exports = { removeFromIndex };
  