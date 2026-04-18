const express = require('express');
const fetch = require('node-fetch');
const app = express();
const manifest = require('./manifest.json');

const CONFIG = {
    cb01_bridge: "https://cb01official.uno",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const streams = [];

    try {
        // 1. Trova il dominio reale
        const bridgeRes = await fetch(CONFIG.cb01_bridge);
        const baseUrl = bridgeRes.url.replace(/\/$/, "");

        // 2. Chiamata a un'API esterna di ricerca (TMDB/Cinemeta) per ottenere il titolo dall'ID tt...
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
        const meta = await metaRes.json();
        const title = meta.meta.name;

        // 3. Cerca il titolo su CB01
        const searchUrl = `${baseUrl}/?s=${encodeURIComponent(title)}`;
        const searchPage = await fetch(searchUrl, { headers: { 'User-Agent': CONFIG.userAgent } });
        const html = await searchPage.text();

        // 4. Estrazione (Regex molto semplice per trovare il primo risultato utile)
        const match = html.match(/<h2 class="entry-title"><a href="(.*?)"/);
        
        if (match && match[1]) {
            streams.push({
                name: "CB01 Engine",
                title: `🎬 Guarda: ${title}\nSorgente: CB01`,
                url: match[1] // Qui stiamo mandando la pagina, Nuvio proverà a risolverla
            });
        }

    } catch (e) {
        console.error(e);
    }

    res.json({ streams });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Engine Online"));
