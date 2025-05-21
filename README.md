# simpleGit

A minimal Git clone built from scratch in Node.js — designed to help developers learn how Git works under the hood.

## 🚀 Overview

`simpleGit` is a command-line tool that mimics the core functionality of Git:
- Initialize a repository
- Add and stage files
- Commit changes
- View commit history
- Check repository status

This project is **purely educational** and is not intended to replace Git. It’s built to demystify the inner workings of Git and help you level up your understanding of version control, file hashing, and data structures like DAGs.

## 🔧 Features (Planned)

- [x] `simplegit init` - Initialize a new repository
- [ ] `simplegit add <file>` - Stage files
- [ ] `simplegit commit -m "message"` - Commit staged changes
- [ ] `simplegit log` - View commit history
- [ ] `simplegit status` - Show current changes
- [ ] Branching & HEAD management
- [ ] Basic merge support
- [ ] Remote push/pull (experimental)

## 📦 Tech Stack

- Node.js
- Native `fs` and `crypto` modules
- CLI framework: [commander](https://www.npmjs.com/package/commander) (or yargs)

## 🧠 Learnings

- How Git stores objects using SHA-1
- Building a simplified index and commit history
- Understanding DAGs and references
- File system operations and CLI architecture

## 📁 Repo Structure

```bash
.simplegit/
  objects/       # stored blobs and commits
  index          # staging area
  HEAD           # current branch reference
  refs/
    heads/
      master     # commit pointer for master
```

If you want to truly understand a tool, rebuild it from scratch
