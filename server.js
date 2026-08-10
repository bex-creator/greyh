const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
    console.log('Client connected to Linux Desktop Stream');

    // 1. Spawn FFmpeg to capture the virtual framebuffer and stream MJPEG over stdout
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'x11grab',
        '-video_size', '1280x720',
        '-framerate', '30',
        '-i', ':99.0',
        '-f', 'mpjpeg',
        '-q:v', '5', // Quality scale (1-31, lower is higher quality)
        'pipe:1'
    ]);

    // Forward binary video frames to the web browser
    ffmpeg.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data, { binary: true });
        }
    });

    ffmpeg.stderr.on('data', (err) => {
        // Logging ffmpeg status output (optional)
    });

    // 2. Receive mouse/keyboard input events from the client
    ws.on('message', (message) => {
        try {
            const event = JSON.parse(message.toString());

            if (event.type === 'mousemove') {
                // Absolute coordinate mouse positioning
                spawn('xdotool', ['mousemove', '--sync', event.x.toString(), event.y.toString()]);
            } else if (event.type === 'mousedown') {
                spawn('xdotool', ['mousedown', event.button.toString()]);
            } else if (event.type === 'mouseup') {
                spawn('xdotool', ['mouseup', event.button.toString()]);
            } else if (event.type === 'keydown') {
                spawn('xdotool', ['key', event.key]);
            }
        } catch (e) {
            console.error('Error processing input event:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        ffmpeg.kill('SIGINT');
    });
});
