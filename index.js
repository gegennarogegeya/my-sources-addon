const express = require('express');
const fetch = require('node-fetch');
const app = express();
const manifest = require('./manifest.json');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const streams = [];

    // Cerchiamo di capire il titolo dall'ID di Nuvio (es. tt0816692 per Interstellar)
    try {
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
        const meta = await metaRes.json();
        const title = meta.meta.name;

        // Proviamo un dominio diretto che spesso funziona come "porta sul retro"
        const searchUrl = `https://cb01.voto/?s=${encodeURIComponent(title)}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Referer': 'https://cb01.voto/'
            }
        });

        const html = await response.text();

        // Cerchiamo il link del primo film trovato
        // La regex cerca il link dentro i titoli degli articoli di CB01
        const linkMatch = html.match(/<h2 class="entry-title"><a href="(.*?)"/);

        if (linkMatch && linkMatch[1]) {
            streams.push({
                name: "fonte sbogia",
                title: `🚀 Trovato: ${title}\nPremi per i link`,
                // Per ora rimandiamo ancora al video di test per confermare l'aggancio
                url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            });
        } else {
            // Se non trova nulla, ci manda un segnale di debug
            streams.push({
                name: "fonte sbogia",
                title: "❌ Film non trovato su CB01",
                url: ""
            });
        }
    } catch (e) {
        streams.push({
            name: "fonte sbogia",
            title: "⚠️ Errore di connessione",
            url: ""
        });
    }

    res.json({ streams });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Ninja Engine Ready"));
