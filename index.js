const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "9.0.0",
    "name": "SelfStream Engine",
    "description": "CB01 Scraper Real-Time",
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
        // 1. Prendo il titolo da Cinemeta
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";
        if (!title) return res.json({ streams: [] });

        // 2. Eseguo la ricerca su CB01
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
        });

        const html = await response.text();

        // 3. ANALISI INTERNA (Regex dinamica)
        // Cerchiamo i link dentro i tag <h2 class="entry-title"> che è lo standard di CB01
        // Se non lo trova, cerca qualsiasi link che non sia roba di sistema (wp-content, ecc)
        const postRegex = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>/gi;
        let match;
        const streams = [];

        while ((match = postRegex.exec(html)) !== null) {
            const linkFound = match[1];
            
            // Verifichiamo che il link trovato sia un post e non una pagina di sistema
            if (linkFound.includes('cb01') && !linkFound.includes('?s=') && !linkFound.includes('/category/')) {
                streams.push({
                    name: "CB01",
                    title: `🎬 GUARDA: ${title}`,
                    externalUrl: linkFound
                });
            }
            if (streams.length >= 2) break;
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
