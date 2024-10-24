const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const url = require('url');
const querystring = require('querystring');

// MongoDB connection string and database information
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'busBookingSystem';

// Create a MongoDB client (without useUnifiedTopology option)
const client = new MongoClient(mongoUrl);

// Function to serve static HTML files
const serveFile = (filePath, contentType, response) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('404 Not Found');
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(data);
        }
    });
};

// Function to handle bus search and save data to MongoDB
const handleBusSearch = async (request, response) => {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });
    
    request.on('end', async () => {
        const formData = querystring.parse(body);
        
        // Connect to MongoDB and insert search data
        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('busSearches');
            
            const result = await collection.insertOne({
                from: formData.from,
                to: formData.to,
                date: formData.date
            });

            console.log('Bus search saved:', result.insertedId);
            // After saving, send the bus results HTML
            serveFile('bus-results.html', 'text/html', response);
        } catch (error) {
            console.error('Error saving bus search:', error);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('500 Internal Server Error');
        }
    });
};

// Function to handle seat selection and save to MongoDB
const handleSeatSelection = async (request, response) => {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });

    request.on('end', async () => {
        const seatData = querystring.parse(body);

        // Connect to MongoDB and insert seat selection data
        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('seatSelections');

            const result = await collection.insertOne({
                busNo: seatData.busNo,
                selectedSeats: seatData.selectedSeats
            });

            console.log('Seat selection saved:', result.insertedId);
            serveFile('passenger-details.html', 'text/html', response);
        } catch (error) {
            console.error('Error saving seat selection:', error);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('500 Internal Server Error');
        }
    });
};

// Function to handle passenger details and save to MongoDB
const handlePassengerDetails = async (request, response) => {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });

    request.on('end', async () => {
        const passengerData = querystring.parse(body);

        // Connect to MongoDB and insert passenger details
        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('passengerDetails');

            const result = await collection.insertOne({
                passengerDetails: passengerData
            });

            console.log('Passenger details saved:', result.insertedId);
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('Passenger details submitted successfully!');
        } catch (error) {
            console.error('Error saving passenger details:', error);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('500 Internal Server Error');
        }
    });
};

// Create the HTTP server
http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    
    // Routing based on the URL path
    if (request.method === 'GET') {
        if (parsedUrl.pathname === '/') {
            serveFile('index.html', 'text/html', response);
        } else if (parsedUrl.pathname === '/bus-results.html') {
            serveFile('bus-results.html', 'text/html', response);
        } else if (parsedUrl.pathname === '/seat-selection.html') {
            serveFile('seat-selection.html', 'text/html', response);
        } else if (parsedUrl.pathname === '/passenger-details.html') {
            serveFile('passenger-details.html', 'text/html', response);
        } else if (parsedUrl.pathname === '/style.css') {
            serveFile('style.css', 'text/css', response);
        } else {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('404 Not Found');
        }
    } else if (request.method === 'POST') {
        if (parsedUrl.pathname === '/bus-search') {
            handleBusSearch(request, response);
        } else if (parsedUrl.pathname === '/seat-selection') {
            handleSeatSelection(request, response);
        } else if (parsedUrl.pathname === '/passenger-details') {
            handlePassengerDetails(request, response);
        } else {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('404 Not Found');
        }
    }
}).listen(5000, () => {
    console.log('Server is listening on port 5000');
});
