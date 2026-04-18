const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "1.0.0",
    "name": "SelfStream Engine",
    "description": "CB01 Scraper con SelfStream",
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
        // 1. Ottieni il titolo da Cinemeta
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";

        if (!title) return res.json({ streams: [] });

        // 2. Ricerca su CB01 (URL originale che fa il redirect)
        const searchUrl = `https://cb01official.uno/?s=${encodeURIComponent(title)}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://cb01official.uno/'
            },
            redirect: 'follow'
        });

        const html = await response.text();

        // 3. Estrazione Link del post
        const postRegex = /<h2 class="entry-title"><a href="([^"]+)"/i;
        const postMatch = html.match(postRegex);

        if (postMatch && postMatch[1]) {
            const moviePageUrl = postMatch[1];
            
            // 4. LOGICA SELFSTREAM: Entra nella pagina del film per cercare i link video
            const moviePageRes = await fetch(moviePageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const movieHtml = await moviePageRes.text();

            // Cerchiamo i link ai vari server (MixDrop, Supervideo, ecc.)
            // Questa regex cattura i link comuni nei post di CB01
            const streamRegex = /href="(https?:\/\/(?:mixdrop|supervideo|upstream|vidoza)\.[a-z]+\/[^"]+)"/gi;
            let match;
            const streams = [];

            while ((match = streamRegex.exec(movieHtml)) !== null) {
                const streamUrl = match[1];
                const provider = streamUrl.split('/')[2].split('.')[0].toUpperCase();
                
                streams.push({
                    name: `SelfStream: ${provider}`,
                    title: `🎬 ${title}\n⚡ Server: ${provider}`,
                    url: streamUrl // Carica direttamente nel player se supportato, o externalUrl
                });
                
                if (streams.length >= 4) break; 
            }

            // Se abbiamo trovato link diretti, li mandiamo
            if (streams.length > 0) return res.json({ streams });

            // Altrimenti mandiamo il link alla pagina come fallback
            return res.json({
                streams: [{
                    name: "CB01",
                    title: `🔗 APRI PAGINA: ${title}`,
                    externalUrl: moviePageUrl
                }]
            });
        }

    } catch (e) {
        // Silenzio
    }

    return res.json({ streams: [] });
});

app.get('/', (req, res) => res.json(manifest));

module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT);
