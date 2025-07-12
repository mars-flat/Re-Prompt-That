const http = require('http');

function createHttpServer(PORT) {
    return http.createServer((req, res) => {
        // Handle direct HTTP requests (when someone visits localhost:4000 in browser)
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Room App Server</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                text-align: center; 
                                padding: 50px; 
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                margin: 0;
                            }
                            .container {
                                background: rgba(255,255,255,0.1);
                                padding: 40px;
                                border-radius: 15px;
                                backdrop-filter: blur(10px);
                                max-width: 600px;
                                margin: 0 auto;
                            }
                            h1 { margin-bottom: 20px; }
                            .status { 
                                background: #4CAF50; 
                                padding: 10px 20px; 
                                border-radius: 25px; 
                                display: inline-block;
                                margin: 20px 0;
                            }
                            .info {
                                background: rgba(255,255,255,0.2);
                                padding: 20px;
                                border-radius: 10px;
                                margin: 20px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Room App Server</h1>
                            <div class="status">Server is running!</div>
                            <div class="info">
                                <h3>Server Status</h3>
                                <p><strong>Port:</strong> ${PORT}</p>
                                <p><strong>Status:</strong> Online and accepting connections</p>
                                <p><strong>Socket.IO:</strong> Ready for WebSocket connections</p>
                            </div>
                            <div class="info">
                                <h3>How to Connect</h3>
                                <p>This server is designed for WebSocket connections from the client app.</p>
                                <p>Use the client application to connect and create/join rooms.</p>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        } else {
            // Handle other HTTP requests
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
}

module.exports = createHttpServer; 