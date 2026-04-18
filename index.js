const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege.cb01",
    "version": "17.0.0",
    "name": "SelfStream CB01",
    "description": "Sorgente CB01",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"]
};

// Middleware fondamentale per CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));
app.get('/', (req, res) => res.json(manifest));

app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const cleanId = id.split(':')[0];

    try {
        // 1. Info film
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";
        if (!title) return res.json({ streams: [] });

        // 2. Ricerca (Dominio CB01UNO che è il più stabile ora)
        const searchUrl = `https://cb01uno.biz/?s=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await searchRes.text();

        // Regex per il link del post
        const postMatch = html.match(/href="(https:\/\/cb01uno\.biz\/[^"]+)"/);
        if (!postMatch) return res.json({ streams: [] });

        // 3. Entra nella pagina
        const pageRes = await fetch(postMatch[1], { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const pageHtml = await pageRes.text();

        const streams = [];
        // Cerchiamo i link ai server principali
        const servers = ["mixdrop", "supervideo", "wolfstream", "upstream", "vidoza"];
        
        servers.forEach(srv => {
            const srvRegex = new RegExp(`href="(https?://(?:www\\.)?${srv}\\.[a-z]+/(?:e|v|f)/[^"]+)"`, "i");
            const srvMatch = pageHtml.match(srvRegex);
            if (srvMatch) {
                streams.push({
                    name: "CB01 🤌",
                    title: `🎬 ${title}\n🌐 Server: ${srv.toUpperCase()}`,
                    url: srvMatch[1]
                });
            }
        });

        // Se non trova link diretti, manda almeno la pagina
        if (streams.length === 0) {
            streams.push({
                name: "CB01 🤌",
                title: `🔗 Vai alla pagina del film`,
                externalUrl: postMatch[1]
            });
        }

        return res.json({ streams });

    } catch (e) {
        return res.json({ streams: [] });
    }
});

module.exports = app;
