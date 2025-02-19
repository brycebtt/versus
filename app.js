const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware to serve HTML files without ".html" in the URL
app.use((req, res, next) => {
    const possibleHtmlPath = path.join(__dirname, "public", req.path + ".html");

    // Check if the request path (without .html) exists as an HTML file
    if (fs.existsSync(possibleHtmlPath)) {
        return res.sendFile(possibleHtmlPath);
    }

    next(); // Pass to the next middleware (express.static or 404 handler)
});

app.use(express.static(path.join(__dirname, "/public")));

// Handle 404 for non-existent routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

module.exports = app;
