const express = require('express');
const app = express();

// Il Manifest integrato per massima compatibilità con Nuvio
const manifest = {
    id: "org.mysources.gege",
    version: "1.0.0",
    name: "Fonte Sbogia",
    description: "Multi-Source Engine per Nuvio",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"]
};

// Middleware per gestire le autorizzazioni (CORS) e il formato dati
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Rotta per il Manifest (Nuvio lo legge all'installazione)
app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Rotta principale per le ricerche (Nuvio la chiama quando premi Play)
app.get('/stream/:type/:id.json', (req, res) => {
    const streams = [
        {
            name: "Fonte Sbogia",
            title: "🚀 Server Online\nTest: Connessione Ok!",
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        }
    ];

    res.json({ streams });
});

// Rotta di cortesia per la home di Vercel
app.get('/', (req, res) => {
    res.json(manifest);
});

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fonte Sbogia pronta sulla porta ${PORT}`);
});

module.exports = app;
