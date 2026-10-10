// server.js
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful error handler — prevents unhandled crash on EADDRINUSE
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Run this to free it:  taskkill /F /IM node.exe`);
        console.error(`   Then restart:         npm run dev\n`);
        process.exit(1);   // clean exit instead of unhandled throw
    } else {
        throw err;
    }
});
