const express = require('express');
const fetch = require('node-fetch');
const app = express();
const manifest = require('./manifest.json');

const CONFIG = {
    cb01_bridge: "https://cb01official.uno",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

// Configurazione CORS per Nuvio
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));

// Questa è la rotta che Nuvio chiama quando selezioni un film
app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const streams = [];

    try {
        // 1. Chiediamo al bridge qual è il vero sito oggi
        const bridgeRes = await fetch(CONFIG.cb01_bridge, { 
            headers: { 'User-Agent': CONFIG.userAgent },
            redirect: 'follow' 
        });
        const realBaseUrl = bridgeRes.url.replace(/\/$/, ""); 

        // 2. Risposta di test dinamica
        // Questo serve per confermare che l'addon sa "inseguire" il dominio
        streams.push({
            name: "CB01 Engine",
            title: `✅ Dominio Attivo:\n${realBaseUrl.split('//')[1]}\n\n(Tocca per test streaming)`,
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        });

    } catch (e) {
        console.error("Errore nel recupero dominio:", e);
    }

    res.json({ streams });
});

// Home page di cortesia
app.get('/', (req, res) => res.send("Engine MySources è attivo!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Addon Ready"));
