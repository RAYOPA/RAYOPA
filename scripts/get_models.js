const https = require('https');
https.get('https://openrouter.ai/api/v1/models', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const models = JSON.parse(data).data;
    const freeLlamas = models.filter(m => m.id.includes('llama') && m.id.includes('free'));
    console.log(freeLlamas.map(m => m.id));
  });
}).on('error', (err) => { console.log('Error: ' + err.message); });
