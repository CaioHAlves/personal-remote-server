const dgram = require('dgram');
const { Resolver } = require('dns').promises;

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
    try {
        // Parse the DNS query to get the hostname
        const hostname = parseDNSQuery(msg);
        if (!hostname) {
            // Forward to Google DNS directly
            forward(msg, rinfo);
            return;
        }

        // Resolve using Node.js DNS (which works on Android)
        const addresses = await resolver.resolve4(hostname);
        const response = buildDNSResponse(msg, addresses);
        server.send(response, 0, response.length, rinfo.port, rinfo.address);
    } catch (err) {
        // On error, try to forward to Google DNS
        forward(msg, rinfo);
    }
});

function parseDNSQuery(msg) {
    try {
        let offset = 12; // Skip header
        let hostname = '';
        while (msg[offset] !== 0 && offset < msg.length) {
            const len = msg[offset];
            offset++;
            if (hostname) hostname += '.';
            hostname += msg.slice(offset, offset + len).toString('ascii');
            offset += len;
        }
        return hostname;
    } catch {
        return null;
    }
}

function buildDNSResponse(query, addresses) {
    const response = Buffer.from(query);
    // Set QR bit (response)
    response[2] |= 0x80;
    // Set answer count
    response[6] = 0;
    response[7] = addresses.length;
    
    let offset = 12;
    // Skip question
    while (response[offset] !== 0 && offset < response.length) {
        offset += response[offset] + 1;
    }
    offset += 5; // null + qtype + qclass
    
    // Add answers
    for (const ip of addresses) {
        // Name pointer
        response[offset] = 0xC0;
        response[offset + 1] = 0x0C;
        offset += 2;
        // Type A
        response.writeUInt16BE(1, offset);
        offset += 2;
        // Class IN
        response.writeUInt16BE(1, offset);
        offset += 2;
        // TTL
        response.writeUInt32BE(300, offset);
        offset += 4;
        // Data length
        response.writeUInt16BE(4, offset);
        offset += 2;
        // IP address
        const parts = ip.split('.').map(Number);
        for (const part of parts) {
            response[offset] = part;
            offset++;
        }
    }
    
    return response.slice(0, offset);
}

function forward(msg, rinfo) {
    const client = dgram.createSocket('udp4');
    client.send(msg, 0, msg.length, 53, '8.8.8.8', () => {
        client.close();
    });
    client.on('message', (response) => {
        server.send(response, 0, response.length, rinfo.port, rinfo.address);
    });
    client.on('error', () => client.close());
}

const PORT = 5353;
server.bind(PORT, '127.0.0.1', () => {
    console.log(`DNS forwarder running on 127.0.0.1:${PORT}`);
});
