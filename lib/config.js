const fs = require('fs/promises');
const path = require('path');

async function setAuthor(author, repoDir = process.cwd()) {
  const gitDir = path.join(repoDir, '.simplegit');
  const configPath = path.join(gitDir, 'config');
  let config = {};
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(data);
  } catch (e) {
    // No config yet, start fresh
  }
  config.author = author;
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`Author set to: ${author}`);
}

async function getAuthor(repoDir = process.cwd()) {
  const configPath = path.join(repoDir, '.simplegit', 'config');
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    return config.author || null;
  } catch {
    return null;
  }
}

module.exports = { setAuthor, getAuthor };
