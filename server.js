const express = require('express');
const app = express();
const http = require('http').createServer(app);
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const net = require('net');

// Function to check if a port is in use
const isPortAvailable = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
};

// Function to find an available port
const findAvailablePort = async (startPort) => {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port++;
    }
    return port;
};

// Function to get Codespace URL
function getCodespaceUrl(port) {
    return process.env.CODESPACE_NAME ? 
        `https://${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}` : 
        `http://localhost:${port}`;
}

// Configure static file serving
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Create WebSocket server attached to HTTP server
const clients = new Set();

// Function to notify clients
function notifyClients(message) {
    console.log(`📢 Notifying ${clients.size} clients:`, message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start server with dynamic port
(async () => {
    try {
        const PORT = await findAvailablePort(3000);
        const server = http.listen(PORT, () => {
            const codespaceUrl = getCodespaceUrl(PORT);
            
            console.log(`
=================================
🚀 Server Status:
---------------------------------
✅ HTTP Server: Running
✅ WebSocket Server: Running
✅ Live Reload: Enabled

📡 Access URLs:
---------------------------------
Local URL:
🔗 http://localhost:${PORT}/
🔗 http://localhost:${PORT}/test.html

${process.env.CODESPACE_NAME ? `Codespace URL:
🔗 ${codespaceUrl}/
🔗 ${codespaceUrl}/test.html` : ''}

🔄 Live Reload Status:
---------------------------------
📂 Watching for file changes in: ${process.cwd()}
📝 File types: .html, .js

ℹ️ Additional Info:
---------------------------------
🔌 Port: ${PORT}
🌐 WebSocket: Running on same port
🔄 Auto Reload: Enabled
=================================
`);
            
            // Initialize WebSocket server
            const wss = new WebSocket.Server({ server });
            
            wss.on('connection', (ws) => {
                console.log('👤 Client connected');
                clients.add(ws);
                
                ws.on('close', () => {
                    console.log('👤 Client disconnected');
                    clients.delete(ws);
                });
            });

            // Test server accessibility
            exec(`curl -s ${codespaceUrl}/test.html`, (error, stdout, stderr) => {
                if (!error) {
                    console.log('✅ Server accessibility test: PASSED');
                } else {
                    console.log('❌ Server accessibility test: FAILED');
                    console.log('Error:', error.message);
                }
            });
        });
        
        // Watch for file changes with debouncing
        let timeoutId = null;
        const watchPath = process.cwd();

        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith('.html') || filename.endsWith('.js'))) {
                console.log(`📝 File changed: ${filename}`);
                
                // Clear existing timeout
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                // Set new timeout to debounce multiple rapid changes
                timeoutId = setTimeout(() => {
                    console.log(`🔄 Triggering reload for file change: ${filename}`);
                    notifyClients('reload');
                }, 100);
            }
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});
