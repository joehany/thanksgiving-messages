const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Messages file path
const messagesFile = path.join(__dirname, 'data', 'messages.json');

// Helper to read/write messages
const getMessages = () => JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
const saveMessages = (messages) => fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

// Routes
app.get('/', (req, res) => res.render('submit'));

app.get('/messages', (req, res) => res.render('messages'));

app.get('/display', (req, res) => res.render('display'));

// API: Get all messages
app.get('/api/messages', (req, res) => res.json(getMessages()));

// API: Submit a message
app.post('/api/messages', (req, res) => {
    const { content } = req.body;
    const messages = getMessages();
    messages.unshift({ content, displayed: false, isCurrentlyDisplayed: false, displayCount: 0 });
    saveMessages(messages);
    res.json({ status: 'success' });
    io.emit('updateMessages');
});

// API: clear all messages
app.post('/api/messages/clear', (req, res) => {
    saveMessages([]);
    res.json({ status: 'success' });
    io.emit('updateMessages');
    io.emit('updateDisplay');
});

// API: Display a message
app.post('/api/messages/display', (req, res) => {
    const { index } = req.body;
    const messages = getMessages();

    // Set all messages to isCurrentlyDisplayed: false
    messages.forEach((msg, i) => {
        if (i === index) {
            msg.isCurrentlyDisplayed = true;
            msg.displayed = true;
            msg.displayCount += 1;
        } else {
            msg.isCurrentlyDisplayed = false;
        }
    });

    saveMessages(messages);
    res.json({ status: 'success' });
    io.emit('updateMessages');
    io.emit('updateDisplay');
});

// WebSocket for real-time updates
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const io = socketIo(server);
