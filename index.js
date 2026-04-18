const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege",
    "version": "11.0.0",
    "name": "SelfStream Engine",
    "description": "CB01 Scraper basato su SelfStream",
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
        // 1. Ottieni il titolo da Cinemeta (come fa SelfStream per mappare l'IMDb)
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";
        if (!title) return res.json({ streams: [] });

        // 2. LOGICA SELFSTREAM: Ricerca sul dominio aggiornato
        const searchUrl = `https://cb01uno.info/?s=${encodeURIComponent(title)}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://cb01uno.info/'
            }
        });

        const html = await response.text();

        // 3. ESTRAZIONE (Seguendo il pattern SelfStream)
        // Cerca i blocchi degli articoli e ne estrae il link
        const regex = /<h2 class="entry-title"><a href="([^"]+)"/g;
        let match;
        const streams = [];

        while ((match = regex.exec(html)) !== null) {
            const movieUrl = match[1];

            // 4. DEEP SCAN (Logica Core di SelfStream)
            // Entra nella pagina del film per pescare gli iframe dei player
            const pageRes = await fetch(movieUrl);
            const pageHtml = await pageRes.text();

            // Cerca i link ai vari hoster (MixDrop, Supervideo, ecc.)
            const hosterRegex = /<(?:iframe|a)[^>]*(?:src|href)="(https?:\/\/(?:mixdrop|supervideo|upstream|vidoza|wolfstream|dood)[^"]+)"/gi;
            let hosterMatch;
            
            while ((hosterMatch = hosterRegex.exec(pageHtml)) !== null) {
                const streamUrl = hosterMatch[1];
                const label = streamUrl.split('/')[2].replace('www.', '').split('.')[0].toUpperCase();

                streams.push({
                    name: `SelfStream`,
                    title: `🎬 ${title}\n🌐 Server: ${label}`,
                    externalUrl: streamUrl
                });
                
                if (streams.length >= 5) break;
            }
            if (streams.length > 0) break; 
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
