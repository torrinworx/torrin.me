const express = require('express');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./ApiRoutes');
const app = express();

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));
} else {
    app.use(express.static(path.join(__dirname, '../public')));
}

// Use API routes
app.use('/api', apiRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
    } else {
        res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
    }
});

const port = process.env.BACKEND_PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
