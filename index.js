const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.mysources.gege.cb01",
    "version": "13.0.0",
    "name": "SelfStream CB01 Official",
    "description": "Sorgente CB01 - Logica Estrazione Profonda",
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
        // 1. Ottieni il titolo pulito da Cinemeta
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`);
        const meta = await metaRes.json();
        const title = meta.meta ? meta.meta.name : "";
        if (!title) return res.json({ streams: [] });

        // 2. Ricerca su CB01 (Dominio attuale)
        const searchUrl = `https://cb01uno.info/?s=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const searchHtml = await searchRes.text();

        // Trova il link del post
        const postMatch = searchHtml.match(/<h2 class="entry-title"><a href="([^"]+)"/i);
        if (!postMatch) return res.json({ streams: [] });
        const moviePageUrl = postMatch[1];

        // 3. LOGICA DI ESTRAZIONE PROFONDA (Come i provider di SelfStream)
        const pageRes = await fetch(moviePageUrl);
        const pageHtml = await pageRes.text();

        const streams = [];

        // --- CERCATORE 1: Link Diretti (MixDrop, Supervideo, ecc.) ---
        const hostRegex = /href="(https?:\/\/(?:mixdrop|supervideo|wolfstream|upstream|vidoza|streamtape)\.[a-z]+\/(?:e|v|f)\/[^"]+)"/gi;
        let m;
        while ((m = hostRegex.exec(pageHtml)) !== null) {
            let url = m[1];
            const name = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();
            streams.push({
                name: `CB01 🤌`,
                title: `🎬 ${title}\n🌐 Server: ${name}\n⚡ Estrazione Diretta`,
                url: url
            });
        }

        // --- CERCATORE 2: Bottoni con ID (Se i link sono nascosti) ---
        // CB01 spesso usa bottoni tipo <a data-id="..." data-link="...">
        const btnRegex = /data-link="([^"]+)"/gi;
        while ((m = btnRegex.exec(pageHtml)) !== null) {
            let url = m[1];
            if (!url.startsWith('http')) continue;
            const name = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();
            streams.push({
                name: `CB01 🤌`,
                title: `🎬 ${title}\n🌐 Server: ${name}\n⚡ Link Dinamico`,
                url: url
            });
        }

        // Se non trova nulla, manda la pagina per non dare errore vuoto
        if (streams.length === 0) {
            streams.push({
                name: "CB01 🤌",
                title: `⚠️ Nessun link diretto trovato\n🔗 Apri pagina sito`,
                externalUrl: moviePageUrl
            });
        }

        return res.json({ streams: streams.slice(0, 5) });

    } catch (e) {
        return res.json({ streams: [] });
    }
});

app.get('/', (req, res) => res.send('CB01 Addon per SelfStream Attivo'));

module.exports = app;
const PORT = process.env.PORT || 3000;
app.listen(PORT);
