const http = require('http');
const fs = require('fs');
const path = require('path');
const process = require('process');
const WebSocket = require('ws');

// Use port 3000 for consistency with devcontainer config
const PORT = 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
    const cwd = process.cwd();
    
    if (req.url === '/' || req.url === '/test.html') {
        fs.readFile(path.join(cwd, 'test.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end(`Error loading test.html: ${err.message}`);
                return;
            }
            // Inject WebSocket client code with dynamic host detection
            const wsClient = `
                <script>
                    (function() {
                        let ws;
                        let reconnectAttempts = 0;
                        const maxReconnectAttempts = 5;
                        
                        function getWebSocketUrl() {
                            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                            const host = window.location.host;
                            return \`\${protocol}//\${host}\`;
                        }
                        
                        function connect() {
                            const wsUrl = getWebSocketUrl();
                            console.log('Connecting to WebSocket:', wsUrl);
                            ws = new WebSocket(wsUrl);
                            
                            ws.onopen = function() {
                                console.log('WebSocket connected');
                                reconnectAttempts = 0;
                                document.getElementById('wsStatus').textContent = 'Connected';
                                document.getElementById('wsStatus').style.color = '#10B981';
                            };
                            
                            ws.onmessage = function(event) {
                                console.log('Received message:', event.data);
                                if (event.data === 'reload') {
                                    console.log('Reloading page...');
                                    window.location.reload();
                                }
                            };
                            
                            ws.onclose = function() {
                                console.log('WebSocket closed');
                                document.getElementById('wsStatus').textContent = 'Disconnected';
                                document.getElementById('wsStatus').style.color = '#EF4444';
                                if (reconnectAttempts < maxReconnectAttempts) {
                                    reconnectAttempts++;
                                    console.log('Attempting to reconnect...');
                                    setTimeout(connect, 1000);
                                }
                            };
                            
                            ws.onerror = function(err) {
                                console.error('WebSocket error:', err);
                                document.getElementById('wsStatus').textContent = 'Error';
                                document.getElementById('wsStatus').style.color = '#EF4444';
                            };
                        }
                        
                        // Start connection when page loads
                        window.addEventListener('load', connect);
                    })();
                </script>
            `;
            const modifiedContent = content.toString().replace('</body>', `${wsClient}</body>`);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(modifiedContent);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// Function to notify clients
function notifyClients(message) {
    console.log(`Notifying ${clients.size} clients:`, message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Watch for file changes with debouncing
let timeoutId = null;
const watchPath = process.cwd();

fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.html') || filename.endsWith('.js'))) {
        console.log(`File changed: ${filename}`);
        
        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Set new timeout to debounce multiple rapid changes
        timeoutId = setTimeout(() => {
            console.log(`Triggering reload for file change: ${filename}`);
            notifyClients('reload');
        }, 100);
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`
=================================
Server running at:
http://localhost:${PORT}/
http://localhost:${PORT}/test.html
WebSocket server running on same port
Live reload enabled - watching for file changes
=================================
`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
