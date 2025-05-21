function help() {
    console.log(`
  SimpleGit - A minimal Git clone
  
  Available commands:
    init       Initialize a new SimpleGit repository
    add        Add file contents to the index
    commit -m "msg"    Record changes to the repository
    status     Show the working tree status
    config --author  "Name <email>"
    help       Show this help message
  
  Make sure to run 'simplegit init' before other commands.
  `);
  }
  
  module.exports = { help };
  