'use strict';

module.exports = {
    connectToWebSocket: function (context, events, done) {
        const WebSocket = require('ws');  // Import WebSocket library

        // Define WebSocket URL
        const wsUrl = `ws://${context.vars.wsUrl}/ws`;

        // Connect to the WebSocket server
        const wsClient = new WebSocket(wsUrl);

        // Handle WebSocket connection opened
        wsClient.on('open', function open() {
            console.log('WebSocket connection established');
        });

        // Handle incoming WebSocket messages
        wsClient.on('message', function incoming(data) {
            const ws_data = JSON.parse(data)

            if (ws_data.message_type === 'init') {
                context.vars.connId = ws_data.data
                done()
            } else {
                // console.log(ws_data.data)
            }
        });

        // Handle WebSocket errors
        wsClient.on('error', function error(err) {
            console.error('WebSocket error:', err);
            done(err);  // Fail the test if there is an error
        });

        // Handle WebSocket connection close
        wsClient.on('close', function close() {
            console.log('WebSocket connection closed');
        });
    }
};
