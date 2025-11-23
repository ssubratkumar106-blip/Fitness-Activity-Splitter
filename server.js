

const http = require('http');


const PORT = 3001;
const REMINDER_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


let reminders = [];

// Function to add a reminder
function addReminder(userId, message, time) {
    // Create a reminder object
    const reminder = {
        id: Date.now(), // Simple ID generation using timestamp
        userId: userId,
        message: message,
        scheduledTime: time,
        createdAt: new Date()
    };
    
    // Add to reminders array
    reminders.push(reminder);
    
    // Log the reminder creation
    console.log(`Reminder added: ${message} for user ${userId} at ${time}`);
    
    return reminder;
}

// Function to check and send due reminders
function checkReminders() {
    const now = new Date();
    
    // Filter reminders that are due
    const dueReminders = reminders.filter(reminder => {
        return new Date(reminder.scheduledTime) <= now;
    });
    
    // Process each due reminder
    dueReminders.forEach(reminder => {
        console.log(`[REMINDER] ${reminder.message} - User: ${reminder.userId}`);
        
        
    });
    
    // Remove sent reminders (in production, mark as sent in database instead)
    reminders = reminders.filter(reminder => {
        return new Date(reminder.scheduledTime) > now;
    });
}


const server = http.createServer((req, res) => {
    // Set CORS headers to allow frontend connections
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parse URL to determine endpoint
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Health check endpoint
    if (url.pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'reminder-service' }));
        return;
    }
    

    if (url.pathname === '/reminders' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reminders: reminders }));
        return;
    }
    
   
    if (url.pathname === '/reminders' && req.method === 'POST') {
        let body = '';
        
        // Collect request body data
        req.on('data', chunk => {
            body += chunk.toString();
        });
        

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const reminder = addReminder(data.userId, data.message, data.time);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, reminder: reminder }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        
        return;
    }
    
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`Reminder service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});


setInterval(() => {
    checkReminders();
}, REMINDER_INTERVAL);

// Check reminders immediately on startup
checkReminders();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down reminder service...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

