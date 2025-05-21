const { initRepo } = require('./lib/init');
const { add } = require('./lib/add');

const [,, command, target] = process.argv;

if (command === 'init') {
  initRepo();
} else if (command === 'add') {
  add(target);
} else {
  console.log('Usage: simplegit <command> [args]');
  console.log('Commands:');
  console.log('  init           Initialize a new repository');
  console.log('  add <path>     Add files or directories');
}
