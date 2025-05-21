const { initRepo } = require('./lib/init');
const { add } = require('./lib/add');
const { help } = require('./lib/help');

const [,, command, target] = process.argv;

if (command === 'init') {
  initRepo();
} else if (command === 'add') {
  add(target);
} else if (command === 'help' || !command) {
  help();
} else {
  console.log(`Unknown command: ${command}`);
  help();
}
