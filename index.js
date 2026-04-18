const express = require('express');
const fetch = require('node-fetch');
const app = express();
const manifest = require('./manifest.json');

const CONFIG = {
    cb01_bridge: "https://cb01official.uno",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

app.get('/manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(manifest);
});

// Questa funzione gestisce la ricerca degli streaming
app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    console.log(`Richiesta stream per ID: ${id}`);

    const streams = [];

    try {
        // 1. Trova il dominio reale di CB01
        const bridgeRes = await fetch(CONFIG.cb01_bridge);
        const baseUrl = bridgeRes.url;

        // 2. Logica di ricerca (da espandere con lo scraper specifico)
        // Per ora aggiungiamo un risultato di test per vedere se l'addon risponde
        streams.push({
            name: "CB01 Engine",
            title: "Cerca su CB01 (In fase di test)",
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
        });

    } catch (e) {
        console.error("Errore nel motore:", e);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ streams });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Addon pronto sulla porta ${PORT}`));
