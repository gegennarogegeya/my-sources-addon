const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Uso esattamente il tuo Manifest per coerenza totale
const manifest = {
    "id": "org.mysources.gege",
    "version": "1.0.0",
    "name": "MySources Engine",
    "description": "Personal Multi-Source Scraper (CB01 & More)",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"]
};

// Middleware per permessi e formato dati
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Rotta per il Manifest (Nuvio lo legge qui)
app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Rotta per lo Streaming (Il cuore dello scraper)
app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    
    try {
        // 1. Chiamata a Cinemeta per ottenere il titolo dal codice IMDB (es. tt0111161)
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "Film";

        // 2. Ricerca su CB01 Official (Senza spazi: cb01official.uno)
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        
        const searchRes = await fetch(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        });

        const html = await searchRes.text();

        // 3. Regex per estrarre il link della pagina del film
        const match = html.match(/<h2 class="entry-title"><a href="(.*?)"/);

        if (match && match[1]) {
            return res.json({
                streams: [{
                    name: "MySources",
                    title: `🎬 CB01 OFFICIAL\n${title}`,
                    externalUrl: match[1]
                }]
            });
        }

        // Se non trova nulla
        return res.json({
            streams: [{ name: "MySources", title: `🔍 Nulla su CB01 per: ${title}`, url: "" }]
        });

    } catch (e) {
        return res.json({
            streams: [{ name: "MySources", title: `⚠️ Errore ricerca: ${e.message}`, url: "" }]
        });
    }
});

// Rotta Home
app.get('/', (req, res) => {
    res.json(manifest);
});

// Esportazione per Vercel
module.exports = app;

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MySources Engine pronto su porta ${PORT}`);
});
