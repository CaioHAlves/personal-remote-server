const net = require('net');
const crypto = require('crypto');

const LOCAL_PORT = 8022;
const RELAY_HOST = 'localhost.run';
const RELAY_PORT = 22;

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

function handleConnection(clientSocket) {
    const id = crypto.randomBytes(4).toString('hex');
    log(`[${id}] New connection from ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

    const serverSocket = net.connect(RELAY_PORT, RELAY_HOST, () => {
        log(`[${id}] Connected to relay`);
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
    });

    serverSocket.on('error', (err) => {
        log(`[${id}] Relay error: ${err.message}`);
        clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
        log(`[${id}] Client error: ${err.message}`);
        serverSocket.destroy();
    });

    clientSocket.on('close', () => {
        log(`[${id}] Client disconnected`);
        serverSocket.destroy();
    });

    serverSocket.on('close', () => {
        log(`[${id}] Relay disconnected`);
        clientSocket.destroy();
    });
}

const server = net.createServer(handleConnection);

server.listen(LOCAL_PORT, '127.0.0.1', () => {
    log(`TCP tunnel listening on 127.0.0.1:${LOCAL_PORT}`);
    log(`Forwarding to ${RELAY_HOST}:${RELAY_PORT}`);
});

server.on('error', (err) => {
    log(`Server error: ${err.message}`);
    process.exit(1);
});
