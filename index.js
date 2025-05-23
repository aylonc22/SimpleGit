const { initRepo } = require('./lib/init');
const { add } = require('./lib/add');
const { help } = require('./lib/help');
const { commit } = require('./lib/commit');
const { log } = require('./lib/log');
const { setAuthor } = require('./lib/config');
const { status } = require('./lib/status');
const { removeFromIndex } = require('./lib/remove');
const { createBranch, checkoutBranch, getCurrentBranch } = require('./lib/branch');
const { mergeBranches } = require('./lib/merge');

const [,, command, ...args] = process.argv;

switch (command) {
  case 'init':
    initRepo();
    break;
  case 'add':
    add(args[0]);
    break;
  case 'status':
    status();
    break;
  case 'merge':
    if(args[0]){
      mergeBranches(args[0]);
    }else{
      console.log(`Usage: simplegit merge <branch name>`);
    }
    break;
  case 'current-branch':
    getCurrentBranch().then(console.log);
    break;
  case 'branch':
    if(args[0]){
      createBranch(args[0]);
    }else{
      console.log(`Usage: simplegit branch <branch name>`);
    }
    break;
  case 'checkout':
    if(args[0]){
      checkoutBranch(args[0]);
    }else{
       console.log(`Usage: simplegit checkout <branch name>`)
    }
      break;
  case 'reset':   
      if (args.length === 0) {
         removeFromIndex(); // unstage all
         console.log('All files unstaged.');
      } else {
        for (const target of args) {
          removeFromIndex(target);
          console.log(`Unstaged: ${target}`);
        }      
    }
    break;
  case 'commit':
    if(args[0] === '-m' && args[1]){
       commit(args[1]);
    }else{
       console.log(`Usage: simplegit commit -m "message"`);
    }
    break;
  case 'log':
    log()
    break;
  case 'config':
    if(args[0] === '--author' && args[1]){
      setAuthor(args[1]);     
   }else{
      console.log(`Usage: simplegit config --author "Name <email>"`);
   }
    break;
  case 'help':
    help();
    break;
  case undefined:
    help();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    help();
    break;
}
