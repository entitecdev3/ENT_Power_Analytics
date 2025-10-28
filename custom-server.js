const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

// Load config.json
const configPath = path.resolve(__dirname, 'config.json');
const config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  : {};

const PORT = config.server?.port || 4004;
const ENABLE_LIVERELOAD = config.server?.livereload;

// Livereload setup (hook into bootstrap)
if (ENABLE_LIVERELOAD) {
  const livereload = require('livereload');
  const connectLivereload = require('connect-livereload');

  cds.on('bootstrap', app => {
    app.use(connectLivereload());

    const liveReloadServer = livereload.createServer({ delay: 100 });
    liveReloadServer.watch([
      path.join(__dirname, 'app'),
      path.join(__dirname, 'srv'),
      path.join(__dirname, 'db')
    ]);

    console.log('📡 Livereload enabled');
  });
}


cds
  .connect()                           
  .then(() => cds.serve('all').in(__dirname)) 
  .then(app => {
    app.listen(PORT, () =>
      console.log(`CAP server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Failed to start CAP server:', err.message);
    process.exit(1);
  });
