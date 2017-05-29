module.exports = {
  runTests: {
    command: 'xvfb-run --server-args="-screen 0 1024x768x24" node_modules/.bin/mocha --reporter spec client/test/*/**.js'
  },
  runTestsAndWatch: {
    command: 'node_modules/.bin/mocha --reporter spec client/test/*/**.js --watch'
  },
  clearNightmare: {
    command: 'rm -rf /tmp/nightmare'
  }
};
