const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    id: "org.mysources.gege",
    version: "1.3.0",
    name: "Fonte Sbogia",
    description: "CB01 Real Engine",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"]
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
    
    try {
        // 1. Chiediamo a Cinemeta il titolo reale del film tramite l'ID (es. tt0816692)
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
        const meta = await metaRes.json();
        const title = meta.meta.name;

        // 2. Cerchiamo il film su CB01
        // Usiamo un dominio aggiornato
        const searchUrl = `https://cb01.voto/?s=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await searchRes.text();

        // 3. Cerchiamo il link della pagina del film nell'HTML
        const match = html.match(/<h2 class="entry-title"><a href="(.*?)"/);

        if (match && match[1]) {
            return res.json({
                streams: [
                    {
                        name: "Fonte Sbogia",
                        title: `✅ Trovato su CB01\n${title}`,
                        // Per ora ti mando alla pagina, poi aggiungeremo il "resolver" per il video
                        externalUrl: match[1] 
                    }
                ]
            });
        }

        // Se non trova nulla su CB01
        return res.json({
            streams: [{ name: "Fonte Sbogia", title: "❌ Film non trovato su CB01", url: "" }]
        });

    } catch (e) {
        return res.json({
            streams: [{ name: "Fonte Sbogia", title: "⚠️ Errore durante la ricerca", url: "" }]
        });
    }
});

app.get('/', (req, res) => res.json(manifest));

module.exports = app;
const PORT = process.env.PORT || 3000;
app.listen(PORT);
