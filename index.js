const { initRepo } = require('./lib/init');
const { add } = require('./lib/add');
const { help } = require('./lib/help');

const [,, command, target] = process.argv;

switch (command) {
  case 'init':
    initRepo();
    break;
  case 'add':
    add(target);
    break;
  case 'help':
  case undefined:
    help();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    help();
    break;
}
