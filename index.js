const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "2.1.0",
    "name": "MySources Engine",
    "description": "CB01 Scraper",
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
    
    try {
        // 1. Otteniamo il titolo da Cinemeta
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";

        if (!title) return res.json({ streams: [] });

        // 2. Chiamata a cb01official.uno con gestione redirect AUTOMATICA
        // Usiamo un timeout lungo per permettere il salto di dominio
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        
        const response = await fetch(searchUrl, {
            method: 'GET',
            redirect: 'follow', // Fondamentale per seguire il salto verso .info
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://cb01official.uno/'
            }
        });

        // Prendiamo l'HTML finale (quello della pagina .info dove siamo atterrati)
        const html = await response.text();

        // 3. Regex per estrarre il link del film
        // Cerchiamo il link che sta sotto il titolo del post
        const regex = /<h2 class="entry-title"><a href="(.*?)"/i;
        const match = html.match(regex);

        if (match && match[1]) {
            return res.json({
                streams: [{
                    name: "CB01",
                    title: `🎬 GUARDA: ${title}`,
                    externalUrl: match[1]
                }]
            });
        }

    } catch (e) {
        // Se c'è un errore, lo ignoriamo e mandiamo lista vuota per non bloccare Nuvio
    }

    return res.json({ streams: [] });
});

app.get('/', (req, res) => res.json(manifest));

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT);
