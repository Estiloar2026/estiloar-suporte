const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1WWGc7tcK4Y6QJnScCv_TtU5GBk3qYPzmj4APhXAdibw';
const DRIVE_FOLDER_ID = '14FD9T-XyxS9-9r-03si0Amrswcn_pzBR';
const MAPS_ID = '1VC-bF8fpFq_1unO7CLbIbeBl_1QOz1I';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'estiloar-admin-2025';

// Mapeamento de imagens técnicas
const IMAGENS_TECNICAS = {
  'ar': [
    'https://estiloar-suporte.onrender.com/ar-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/ar-tecnico-2.png',
    'https://estiloar-suporte.onrender.com/ar-tecnico-3.png'
  ],
  'ecocompact': [
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-2.png',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-3.png',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-4.png'
  ],
  'geladeira-35l': [
    'https://estiloar-suporte.onrender.com/geladeira-35l-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/geladeira-35l-tecnico-2.png'
  ],
  'geladeira-45l': [
    'https://estiloar-suporte.onrender.com/geladeira-45l-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/geladeira-45l-tecnico-2.png'
  ],
  'geladeira-55l': [
    'https://estiloar-suporte.onrender.com/geladeira-55l-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/geladeira-55l-tecnico-2.png'
  ],
  'gerador': [
    'https://estiloar-suporte.onrender.com/gerador-tecnico-1.png'
  ]
};

// Detecta pedido de imagem técnica e qual produto
function detectarImagemTecnica(mensagem) {
  const m = mensagem.toLowerCase();
  if (!m.includes('tecni') && !m.includes('medida') && !m.includes('dimensão') && !m.includes('dimensao')) return null;
  if (m.includes('eco') || m.includes('compact')) return 'ecocompact';
  if (m.includes('35') || m.includes('35l')) return 'geladeira-35l';
  if (m.includes('45') || m.includes('45l')) return 'geladeira-45l';
  if (m.includes('55') || m.includes('55l')) return 'geladeira-55l';
  if (m.includes('geladeira') || m.includes('frigobar')) return 'geladeira-35l';
  if (m.includes('gerador')) return 'gerador';
  if (m.includes('ar') || m.includes('condicionado') || m.includes('eletrico') || m.includes('elétrico')) return 'ar';
  return null;
}

// Índice de pastas em memória
let indiceDrive = [];
let ultimaAtualizacao = null;

// Mapeamento de modelos para marcas
const MODELOS_MARCAS = {
  'hr': 'hyundai', 'hd': 'hyundai',
  'r450': 'scania', 'r500': 'scania', 's500': 'scania', 'p360': 'scania', 'g420': 'scania',
  'fh': 'volvo', 'fm': 'volvo', 'fmx': 'volvo', 'vm': 'volvo',
  'actros': 'mercedes', 'axor': 'mercedes', 'atego': 'mercedes', 'accelo': 'mercedes',
  'tector': 'iveco', 'stralis': 'iveco',
  'tgx': 'man', 'tgs': 'man', 'tgm': 'man',
  'cargo': 'ford',
  'constellation': 'volkswagen', 'delivery': 'volkswagen',
  'ducato': 'fiat',
};

// Token Google Drive
async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: email, scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now
  })).toString('base64url');
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, 'base64url');
  const jwt = `${header}.${payload}.${signature}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await response.json();
  return data.access_token;
}

// Busca subpastas
async function buscarSubpastas(token, pastaId) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${pastaId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&pageSize=1000`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await response.json();
  return data.files || [];
}

// Constrói índice
async function construirIndice() {
  console.log('Construindo índice do Drive...');
  const token = await getAccessToken();
  const novoIndice = [];
  const marcas = await buscarSubpastas(token, DRIVE_FOLDER_ID);
  for (const marca of marcas) {
    const modelos = await buscarSubpastas(token, marca.id);
    if (modelos.length === 0) {
      novoIndice.push({ marca: marca.name.toLowerCase(), marcaNome: marca.name, modelo: marca.name.toLowerCase(), modeloNome: marca.name, id: marca.id, link: `https://drive.google.com/drive/folders/${marca.id}` });
    } else {
      for (const modelo of modelos) {
        novoIndice.push({ marca: marca.name.toLowerCase(), marcaNome: marca.name, modelo: modelo.name.toLowerCase(), modeloNome: modelo.name, id: modelo.id, link: `https://drive.google.com/drive/folders/${modelo.id}` });
      }
    }
  }
  indiceDrive = novoIndice;
  ultimaAtualizacao = new Date();
  console.log(`Índice: ${novoIndice.length} pastas`);
  return novoIndice.length;
}

// Busca no índice
function buscarNoIndice(query) {
  if (indiceDrive.length === 0) return null;
  const q = query.toLowerCase();
  let marcaBusca = '';
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(modelo)) { marcaBusca = marca; break; }
  }
  const resultados = indiceDrive.filter(item => {
    if (marcaBusca) return item.marca.includes(marcaBusca);
    const palavras = q.split(' ').filter(p => p.length > 2);
    return palavras.some(p => item.marca.includes(p) || item.modelo.includes(p));
  });
  return resultados.length > 0 ? resultados : null;
}

// Calcula distância entre duas coordenadas (Haversine)
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Busca coordenadas de uma cidade via Nominatim
async function buscarCoordenadas(cidade) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade + ', Brasil')}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'EstiloAR-Suporte/1.0' } });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (err) {
    console.error('Erro coordenadas:', err);
    return null;
  }
}

// Busca pontos de assistência no mapa KML
async function buscarAssistencia(cidade) {
  try {
    const url = `https://www.google.com/maps/d/u/0/kml?mid=${MAPS_ID}&forcekml=1&lid=0`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      console.error('KML status:', response.status);
      return null;
    }
    const kml = await response.text();
    console.log('KML tamanho:', kml.length);

    const placemarks = [];
    const regex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
    let match;
    while ((match = regex.exec(kml)) !== null) {
      const bloco = match[1];
      const nome = (bloco.match(/<name>\s*([\s\S]*?)\s*<\/name>/) || [])[1] || '';
      const desc = (bloco.match(/<description>\s*([\s\S]*?)\s*<\/description>/) || [])[1] || '';
      const coords = (bloco.match(/<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/) || [])[1] || '';
      if (coords) {
        const partes = coords.trim().split(/[,\s]+/);
        const lng = parseFloat(partes[0]);
        const lat = parseFloat(partes[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          placemarks.push({
            nome: nome.trim(),
            descricao: desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
            lat, lng
          });
        }
      }
    }

    console.log(`KML: ${placemarks.length} pontos encontrados`);
    if (placemarks.length === 0) return null;

    let coordCidade = null;
    if (cidade && cidade.length > 2) {
      coordCidade = await buscarCoordenadas(cidade);
      console.log(`Coordenadas de "${cidade}":`, coordCidade);
    }

    if (coordCidade) {
      const comDistancia = placemarks.map(p => ({
        ...p,
        distancia: calcularDistancia(coordCidade.lat, coordCidade.lng, p.lat, p.lng)
      })).sort((a, b) => a.distancia - b.distancia);
      return comDistancia.slice(0, 2).map(p => ({
        ...p,
        distanciaTexto: `${Math.round(p.distancia)} km`
      }));
    }

    return placemarks.slice(0, 2);
  } catch (err) {
    console.error('Erro KML:', err);
    return null;
  }
}

// Busca planilha
async function buscarDadosPlanilha() {
  try {
    const abas = ['Ar-Condicionado', 'Geladeira Port%C3%A1til', 'Gerador Digital 24V', 'Promo%C3%A7%C3%B5es Ativas', 'Formas de Pagamento'];
    let dados = '';
    for (const aba of abas) {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${aba}`;
      const response = await fetch(url);
      if (response.ok) dados += `\n=== ${decodeURIComponent(aba)} ===\n${await response.text()}\n`;
    }
    return dados;
  } catch (err) { return ''; }
}

// Login
app.post('/api/login', (req, res) => {
  const { senha } = req.body;
  if (senha === process.env.SENHA_ACESSO) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

// Admin
app.get('/admin/atualizar-indice', async (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const total = await construirIndice();
    res.json({ sucesso: true, totalPastas: total, atualizadoEm: ultimaAtualizacao });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const MANUAL_CONTEXT = `
Você é o Pedro, assistente de suporte de vendas da Estilo AR.
Você é um ser humano. Nunca diga que é IA ou robô.

JEITO DE SER:
- Simpático, coloquial mas profissional
- Responde em português brasileiro
- Usa emojis com moderação
- Para problemas graves sugere: (34) 3293-8000

EMPRESA: Estilo AR | Tel: (34) 3293-8000 | Seg-Sex 08h-18h | www.estiloar.com.br | Uberlândia-MG

REGRAS CRÍTICAS:
- NUNCA invente informações, preços, depoimentos ou dados técnicos
- NUNCA busque informações em sites externos ou outras fontes
- NUNCA mencione outras marcas ou concorrentes
- Use APENAS as informações dos manuais, planilha e dados fornecidos neste contexto
- Se não souber, diga honestamente e sugira ligar para (34) 3293-8000
- Sobre depoimentos: apresente APENAS os links das pastas fornecidos
- Sobre preços: use APENAS os dados da planilha fornecida
- Sobre assistência técnica: apresente APENAS os pontos fornecidos no contexto

PRODUTOS: Ar-Condicionado 100% Elétrico, Ar-Condicionado Eco Compact, Geladeira Portátil e Gerador Digital 24V.

PRODUTO 1 - AR-CONDICIONADO 100% ELÉTRICO:
(Manual em atualização — para dúvidas técnicas sugira ligar para (34) 3293-8000)

PRODUTO 2 - AR-CONDICIONADO ECO COMPACT:
(Manual em breve — para dúvidas técnicas sugira ligar para (34) 3293-8000)

PRODUTO 3 - GELADEIRA PORTÁTIL:
Modelos: 35L, 45L, 55L | Tensão: DC 12V/24V ou AC 100-240V
Temperatura: -20°C a +20°C | Potência: 60W
Proteção bateria: Baixo/Médio/Alto (segurar botão config 3 segundos)
Modos: HH (resfriamento rápido) e ECO (economia)
Temperaturas recomendadas: bebidas 5°C, frutas 5-8°C, verduras 3-10°C, carne -18°C
Erros: F1=baixa tensão, F2=ventilador, F3=compressor, F4=velocidade baixa, F5=temperatura alta, F6=controlador, F7/F8=sensor
Garantia: 3 meses.

PRODUTO 4 - GERADOR DIGITAL 24V:
Modelos: LE-3000i e LE-3000i Pro | Tensão: 28V DC | Potência: até 1.800W
Combustível: gasolina sem chumbo (4L) | Óleo: SJ10W-40 (0,4L)
NUNCA usar em ambientes fechados. NUNCA ligar sem óleo.
Tensão mínima partida: 17,5V
Luzes: verde=ok, vermelho 2x=curto, vermelho 7x=bateria descarregada, óleo acesa=adicionar óleo
Garantia: 3 meses.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Inválido' });

  try {
    const ultimaMensagem = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Detecta pedido de imagem técnica
    const produtoTecnico = detectarImagemTecnica(ultimaMensagem);
    if (produtoTecnico) {
      const imagens = IMAGENS_TECNICAS[produtoTecnico];
      if (imagens && imagens.length > 0) {
        const links = imagens.map((img, i) => `🖼️ **Imagem ${i+1}**: ${img}`).join('\n');
        return res.json({ reply: `Aqui estão as imagens técnicas:\n\n${links}\n\nQualquer dúvida é só chamar! 😊` });
      }
    }

    // Detecta busca de depoimentos/Drive
    const palavrasDepoimento = ['depoimento', 'instalação', 'instalacao', 'cliente', 'referencia', 'referência', 'quem instalou', 'ja instalou', 'já instalou'];
    const marcasVeiculos = ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'volkswagen', 'vw', 'hyundai', 'fiat', ...Object.keys(MODELOS_MARCAS)];
    const buscaDrive = palavrasDepoimento.some(p => ultimaMensagem.includes(p)) || marcasVeiculos.some(m => ultimaMensagem.includes(m));

    // Detecta busca de assistência técnica — só ativa com palavras específicas de assistência
    const palavrasAssistencia = ['assistência técnica', 'assistencia tecnica', 'ponto autorizado', 'autorizada', 'mais perto', 'mais próximo', 'ponto de serviço', 'ponto de servico', 'onde conserto', 'onde reparo', 'quem conserta', 'quem repara'];
    const buscaAssistencia = palavrasAssistencia.some(p => ultimaMensagem.includes(p));

    // Busca Drive
    if (buscaDrive) {
      if (indiceDrive.length === 0) {
        try { await construirIndice(); } catch (err) { console.error(err); }
      }
      const resultados = buscarNoIndice(ultimaMensagem);
      if (resultados && resultados.length > 0) {
        const links = resultados.map(r => `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`).join('\n');
        return res.json({ reply: `Encontrei ${resultados.length} pasta(s) no Drive:\n\n${links}\n\nQualquer dúvida é só chamar! 😊` });
      } else {
        return res.json({ reply: `Não encontrei pastas para essa busca. Para mais informações ligue para **(34) 3293-8000**. 😊` });
      }
    }

    // Busca assistência técnica
    if (buscaAssistencia) {
      // Extrai cidade da mensagem de forma mais ampla
      const cidadeMatch = ultimaMensagem.match(/(?:em|de|perto de|próximo a|próximo de|para|na cidade de|no município de)\s+([a-záàãâéêíóôõúç\s]+?)(?:\?|$|,|\.)/i);
      const cidade = cidadeMatch ? cidadeMatch[1].trim() : ultimaMensagem.replace(/assistência|assistencia|técnica|tecnica|autorizada|mais perto|mais próximo|próximo|tem|qual|onde|fica|há|preciso/gi, '').trim();
      const pontos = await buscarAssistencia(cidade);
      if (pontos && pontos.length > 0) {
        const lista = pontos.map((p, i) => {
          let info = `📍 **${i+1}. ${p.nome}**`;
          if (p.distanciaTexto) info += ` — aproximadamente ${p.distanciaTexto}`;
          if (p.descricao) info += `\n${p.descricao.substring(0, 300)}`;
          return info;
        }).join('\n\n');
        return res.json({ reply: `Encontrei os 2 pontos de assistência técnica mais próximos:\n\n${lista}\n\nQualquer dúvida é só chamar! 😊` });
      } else {
        return res.json({ reply: `Não encontrei pontos de assistência técnica para essa localidade. Por favor ligue para **(34) 3293-8000** para mais informações. 😊` });
      }
    }

    // Busca planilha e chama modelo
    const dadosPlanilha = await buscarDadosPlanilha();
    const contexto = MANUAL_CONTEXT + `\n========\nDADOS DA PLANILHA (preços/promoções/pagamento):\n${dadosPlanilha || 'Indisponível — sugira ligar para (34) 3293-8000'}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 800,
        temperature: 0.7,
        messages: [{ role: 'system', content: contexto }, ...messages]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API' });
    res.json({ reply: data.choices?.[0]?.message?.content || 'Sem resposta.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// Atualiza índice a cada 24h
setInterval(async () => {
  try { await construirIndice(); } catch (err) { console.error(err); }
}, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor na porta ${PORT}`);
  try { await construirIndice(); } catch (err) { console.error(err); }
});
