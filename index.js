const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "4.1.0",
    "name": "MySources Engine",
    "description": "CB01 Scraper Professional",
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
        // 1. Meta-dati
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";
        if (!title) return res.json({ streams: [] });

        // 2. La ricerca su CB01 (Usando l'URL che fa il redirect)
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            redirect: 'follow'
        });

        const html = await response.text();

        // 3. ESTRAZIONE LINK (Logica copiata dagli scraper funzionanti)
        // Cerchiamo il link del post che contiene il titolo nel tag <a> dentro l'h2
        const regex = /<h2 class="entry-title"><a href="([^"]+)"/g;
        let match;
        const streams = [];

        while ((match = regex.exec(html)) !== null) {
            const link = match[1];
            // Se il link contiene il dominio corretto (quello del redirect), lo prendiamo
            if (link.includes('cb01')) {
                streams.push({
                    name: "MySources",
                    title: `🎬 CB01: ${title}`,
                    externalUrl: link
                });
            }
            if (streams.length >= 3) break; // Non mandare troppi link
        }

        return res.json({ streams: streams });

    } catch (e) {
        return res.json({ streams: [] });
    }
});

app.get('/', (req, res) => res.json(manifest));

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT);
