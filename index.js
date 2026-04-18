const express = require('express');
const fetch = require('node-fetch');
const app = express();

const manifest = {
    "id": "org.selfstream.community.real",
    "version": "1.0.0",
    "name": "SelfStream SC 🤌",
    "description": "StreamingCommunity HLS Proxy",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"]
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/manifest.json', (req, res) => res.json(manifest));
app.get('/', (req, res) => res.json(manifest));

app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const cleanId = id.split(':')[0];

    try {
        // Logica VixSrc: Genera il link che passa dal proxy HLS dell'addon
        const streams = [{
            name: "SC 🤌",
            title: "🎬 StreamingCommunity\n⚡ FHD - HLS Proxy\n🔊 Italiano",
            url: `https://${req.headers.host}/proxy/hls/manifest.m3u8?id=${cleanId}&type=${type}`
        }];
        return res.json({ streams });
    } catch (e) {
        return res.json({ streams: [] });
    }
});

// Il Proxy HLS che bypassa i blocchi (Logica SelfStream)
app.get('/proxy/hls/manifest.m3u8', async (req, res) => {
    const { id, type } = req.query;
    try {
        // Otteniamo lo slug o l'ID interno da StreamingCommunity
        const search = await fetch(`https://streamingcommunity.computer/api/search?q=${id}`).then(r => r.json());
        const scId = search.data?.[0]?.id;
        
        if (!scId) return res.status(404).send("Not Found");

        // Puntiamo al master manifest del loro server video (VixCloud)
        const playlistUrl = `https://vixcloud.co/storage/encodings/${scId}/playlist.m3u8`;

        const response = await fetch(playlistUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://streamingcommunity.computer/',
                'Origin': 'https://streamingcommunity.computer'
            }
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        response.body.pipe(res);
    } catch (e) {
        res.status(500).send("Proxy Error");
    }
});

module.exports = app;
