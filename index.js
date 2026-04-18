const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "1.0.0",
    "name": "MySources Engine",
    "description": "Personal Multi-Source Scraper (CB01 & More)",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"]
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const cleanId = id.split(':')[0];
    let title = cleanId; // Fallback immediato

    try {
        // Chiamata a Cinemeta con timeout corto e controllo errore
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`, { timeout: 2500 });
        
        if (metaRes.ok) {
            const data = await metaRes.json().catch(() => null);
            if (data && data.meta) title = data.meta.name;
        }
    } catch (e) { 
        // Se Cinemeta fallisce, non facciamo nulla, title resta l'ID
    }

    try {
        // Ricerca su CB01
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 4000
        });

        if (searchRes.ok) {
            const html = await searchRes.text();
            const match = html.match(/<h2 class="entry-title"><a href="(.*?)"/);

            if (match && match[1]) {
                return res.json({
                    streams: [{
                        name: "MySources",
                        title: `🔗 APRI: ${title}`,
                        externalUrl: match[1]
                    }]
                });
            }
        }
    } catch (e) {
        // Errore silenzioso
    }

    // Se arriviamo qui, mandiamo una lista vuota. Nuvio NON darà errore.
    return res.json({ streams: [] });
});

app.get('/', (req, res) => res.json(manifest));

module.exports = app;
