const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');
const ignore = require('ignore');

async function add(target, cwd = process.cwd()) {
  const gitDir = path.join(cwd, '.simplegit');
  const headPath = path.join(gitDir, 'HEAD');
  const indexdPath = path.join(gitDir, 'index');
  const commitsDir = path.join(gitDir, 'commits');
  let addFlag = false;

  try {
    const stat = await fs.stat(gitDir);
    if (!stat.isDirectory()) {
      console.error('Error: This directory is not a SimpleGit repository (missing .simplegit folder).');
      console.log("Run 'simplegit init' to create a new repository.");
      process.exit(1);
    }
  } catch (err) {
    console.error('Error: This directory is not a SimpleGit repository (missing .simplegit folder).');
    console.log("Run 'simplegit init' to create a new repository.");
    process.exit(1);
  }

  const indexPath = path.join(gitDir, 'index');
  const objectsDir = path.join(gitDir, 'objects');
  const ignoreFilePath = path.join(cwd, '.simplegitignore');
  let ig = ignore();

  try {
    const ignoreContent = await fs.readFile(ignoreFilePath, 'utf8');
    ig = ignore().add(ignoreContent);
  } catch {
    // No .simplegitignore file found, ignore empty
  }

  // Helper to recursively get all files inside a directory
  async function getFilesRecursively(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const filePath = path.join(dir, file.name);
      const relative = path.relative(cwd, filePath).replace(/\\/g, '/');
      // Skip ignored files/directories
    if (ig.ignores(relative)) continue;
      if (file.isDirectory()) {
        results = results.concat(await getFilesRecursively(filePath));
      } else if (file.isFile()) {
        results.push(filePath);
      }
    }
    return results;
  }

  // Helper to add a single file to objects and index
  async function addSingleFile(filePath) {
    const relativePath = path.relative(cwd, filePath).replace(/\\/g, '/');

    let committedFiles = {};
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const normalized = content.replace(/\r\n/g, '\n');
      const hash = crypto.createHash('sha1').update(normalized).digest('hex');

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
              committedFiles[relativePath] = hash;
            }
          });
        } catch(e) {          
          // No commits yet
        }
        if(committedFiles[relativePath] === hash){
          return;
        }

        let addedFiles = [];
        // Read current index file
        try{
          const indexContent = await fs.readFile(indexPath, 'utf-8');
          indexContent.split('\n').forEach(line => {
            const [hash, filename] = line.split(' ');             
            if (filename && hash) {          
              addedFiles[relativePath] = hash;
          }
        });
        }
        catch{

        }
        if(addedFiles[relativePath] === hash){
          return;
        }
      const objectPath = path.join(objectsDir, hash);
      await fs.writeFile(objectPath, content);
  
      // Read existing index
      let indexMap = {};
      try {
        const currentIndex = await fs.readFile(indexPath, 'utf-8');
        currentIndex.trim().split('\n').forEach(line => {
          const [filename, filehash] = line.split(' ');
          if (filename && filehash) indexMap[filename] = filehash;
        });
      } catch {
        // ignore if index doesn't exist
      }
  
      // Update the hash for this file
      indexMap[relativePath] = hash;
  
      // Write back the updated index
      const updatedIndexContent = Object.entries(indexMap)
        .map(([filename, filehash]) => `${filehash} ${filename}`)
        .join('\n') + '\n';
  
      await fs.writeFile(indexPath, updatedIndexContent);
      addFlag = true;
  
      console.log(`Added ${relativePath}`);
    } catch (err) {      
      console.error(`Failed to add ${relativePath}:`, err.message);
    }
  }
  

  if (!target) {
    console.error('Please specify a file or directory to add.');
    process.exit(1);
  }

  if (target === '.' || target === './') {
    // Recursive add all files in cwd
    const files = await getFilesRecursively(cwd);
    for (const filePath of files) {
      await addSingleFile(filePath);
    }
    if(!addFlag){
      console.log('Nothing to add. All files are already staged or unchanged.')
    }
  } else if (target === '*') {
    // Add all files (non-recursive) in cwd
    const list = await fs.readdir(cwd, { withFileTypes: true });
    for (const dirent of list) {
      const relative = dirent.name;
      if (dirent.isFile() && !ig.ignores(relative)) {
        await addSingleFile(path.join(cwd, dirent.name));
      }
    }
    if(!addFlag){
      console.log('Nothing to add. All files are already staged or unchanged.')
    }
  } else {
    // Could be full or relative path
    const fullPath = path.resolve(cwd, target);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        const files = await getFilesRecursively(fullPath);
        for (const filePath of files) {
          await addSingleFile(filePath);
        }
        if(!addFlag){
          console.log('Nothing to add. All files are already staged or unchanged.')
        }
      } else if (stat.isFile()) {
        await addSingleFile(fullPath);
        if(!addFlag){
          console.log('Nothing to add. All files are already staged or unchanged.')
        }
      } else {
        console.error('Unsupported file type or path:', target);
      }
    } catch (err) {
      console.error(`Error accessing path: ${err.message}`);
    }
  }
}

module.exports = { add };
