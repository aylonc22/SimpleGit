const { initRepo } = require('./lib/init');

const [,, command] = process.argv;

if (command === 'init') {
  initRepo();
} else {
  console.log('Usage: simplegit init');
}
