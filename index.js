const express = require('express');
const app = express();

const manifest = {
    id: "org.mysources.gege",
    version: "1.2.0",
    name: "Fonte Sbogia",
    description: "Multi-Source Engine per Nuvio",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"]
};

// Intestazioni di sicurezza e permessi (CORS) - Versione Potenziata
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rotta Manifest
app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Rotta Stream
app.get('/stream/:type/:id.json', (req, res) => {
    // Rispondiamo con un link MP4 diretto e pulito
    const streams = [
        {
            name: "Fonte Sbogia",
            title: "📺 TEST VIDEO DIRETTO\nSe lo vedi, il sistema funziona!",
            url: "https://www.w3schools.com/html/mov_bbb.mp4" 
        }
    ];

    res.json({ streams });
});

// Rotta Home per Vercel
app.get('/', (req, res) => {
    res.send("Fonte Sbogia Server is Online");
});

// Export per Vercel
module.exports = app;
