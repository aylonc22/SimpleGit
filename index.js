const { initRepo } = require('./lib/init');
const { add } = require('./lib/add');
const { help } = require('./lib/help');
const { commit } = require('./lib/commit');

const [,, command, ...args] = process.argv;

switch (command) {
  case 'init':
    initRepo();
    break;
  case 'add':
    add(args[0]);
    break;
  case 'commit':
    if(args[0] === '-m' && args[1]){
       commit(args[1]);
    }else{
       console.log(`Usage: simplegit commit -m "message"`);
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
