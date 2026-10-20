const http = require('http');
const fs = require('fs');
const path = require('path');

// Set the port to match your Python script
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = path.join(__dirname, 'database');
const FILE_PATH = path.join(DATA_DIR, 'laptops.json');
const MAX_BODY_BYTES = 1024 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });

const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
        return;
    }

    let body = '';
    let tooLarge = false;
    req.on('data', chunk => {
        if (tooLarge) return;
        if (Buffer.byteLength(body) + chunk.length > MAX_BODY_BYTES) {
            tooLarge = true;
            body = '';
            return;
        }
        body += chunk;
    });

    req.on('end', () => {
        if (tooLarge) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Payload too large' }));
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(body);
            if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
                throw new TypeError('Expected a JSON object');
            }
        } catch (error) {
            console.error('Invalid inventory payload:', error.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }));
            return;
        }

        try {
            let existingData = [];
            if (fs.existsSync(FILE_PATH)) {
                const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
                if (fileContent.trim()) {
                    existingData = JSON.parse(fileContent);
                    if (!Array.isArray(existingData)) existingData = [existingData];
                }
            }

            existingData.push(parsedData);
            fs.writeFileSync(FILE_PATH, JSON.stringify(existingData, null, 2), 'utf8');
            console.log(`[${new Date().toISOString()}] Saved specifications for: ${parsedData.Model || 'Unknown Device'}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', message: 'Data logged successfully' }));
        } catch (error) {
            console.error('Unable to persist inventory data:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Unable to save inventory data' }));
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
    console.log(`Data will be appended to: ${FILE_PATH}`);
});