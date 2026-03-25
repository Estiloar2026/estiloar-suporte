const express = require('express');
const cors = require('cors');
const cidadesModule = require('./cidades');
const buscarCidade = cidadesModule.buscarCidade || (() => null);
const cidadesMaisProximas = cidadesModule.cidadesMaisProximas || (() => []);
const duasMaisProximas = cidadesModule.duasMaisProximas || cidadesModule.cidadesMaisProximas || (() => []);
const CIDADES_BR_MODULE = cidadesModule.CIDADES_BR || cidadesModule.default || cidadesModule;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1WWGc7tcK4Y6QJnScCv_TtU5GBk3qYPzmj4APhXAdibw';
const DRIVE_FOLDER_ID = '14FD9T-XyxS9-9r-03si0Amrswcn_pzBR';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'estiloar-admin-2025';

// Mapeamento de imagens técnicas
const IMAGENS_TECNICAS = {
  'ar': [
    'https://estiloar-suporte.onrender.com/ar-tecnico-1.png',
    'https://estiloar-suporte.onrender.com/ar-tecnico-2.png',
    'https://estiloar-suporte.onrender.com/ar-tecnico-3.png'
  ],
  'ecocompact': [
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-1.jpg',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-2.jpg',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-3.jpg',
    'https://estiloar-suporte.onrender.com/ecocompact-tecnico-4.jpg'
  ],
  'geladeira-35l': [
    'https://estiloar-suporte.onrender.com/geladeira-35l-tecnico-1.jpg',
    'https://estiloar-suporte.onrender.com/geladeira-35l-tecnico-2.jpg'
  ],
  'geladeira-45l': [
    'https://estiloar-suporte.onrender.com/geladeira-45l-tecnico-1.jpg',
    'https://estiloar-suporte.onrender.com/geladeira-45l-tecnico-2.jpg'
  ],
  'geladeira-55l': [
    'https://estiloar-suporte.onrender.com/geladeira-55l-tecnico-1.jpg',
    'https://estiloar-suporte.onrender.com/geladeira-55l-tecnico-2.jpg'
  ],
  'gerador': [
    'https://estiloar-suporte.onrender.com/gerador-tecnico-1.png'
  ]
};

// Mapeamento de fotos do carrossel
const FOTOS_PRODUTOS = {
  'ar': [
    'https://estiloar-suporte.onrender.com/ar.png',
    'https://estiloar-suporte.onrender.com/ar-1.png',
    'https://estiloar-suporte.onrender.com/ar-2.png',
    'https://estiloar-suporte.onrender.com/ar-3.png'
  ],
  'ecocompact': [
    'https://estiloar-suporte.onrender.com/ecocompact.png',
    'https://estiloar-suporte.onrender.com/ecocompact-1.png',
    'https://estiloar-suporte.onrender.com/ecocompact-2.png',
    'https://estiloar-suporte.onrender.com/ecocompact-3.png',
    'https://estiloar-suporte.onrender.com/ecocompact-4.png'
  ],
  'geladeira': [
    'https://estiloar-suporte.onrender.com/geladeira.png',
    'https://estiloar-suporte.onrender.com/geladeira-1.png',
    'https://estiloar-suporte.onrender.com/geladeira-2.png',
    'https://estiloar-suporte.onrender.com/geladeira-3.png',
    'https://estiloar-suporte.onrender.com/geladeira-4.png'
  ],
  'gerador': [
    'https://estiloar-suporte.onrender.com/gerador.png',
    'https://estiloar-suporte.onrender.com/gerador-1.png',
    'https://estiloar-suporte.onrender.com/gerador-2.png',
    'https://estiloar-suporte.onrender.com/gerador-3.png',
    'https://estiloar-suporte.onrender.com/gerador-4.png'
  ]
};

// Detecta pedido de foto do produto
function detectarFotoProduto(mensagem) {
  const m = mensagem.toLowerCase();
  // Não ativa se for imagem técnica ou assistência
  if (m.includes('tecni') || m.includes('medida') || m.includes('dimensao') || m.includes('dimensão')) return null;
  if (m.includes('assistencia') || m.includes('assistência')) return null;
  // Ativa com palavras de foto/imagem + produto
  const querFoto = m.includes('foto') || m.includes('imagem') || m.includes('fotos') || m.includes('imagens') || m.includes('ver o produto') || m.includes('ver o ar') || m.includes('ver a geladeira') || m.includes('ver o gerador');
  if (!querFoto) return null;
  if (m.includes('eco') || m.includes('compact')) return 'ecocompact';
  if (m.includes('geladeira') || m.includes('frigobar')) return 'geladeira';
  if (m.includes('gerador')) return 'gerador';
  if (m.includes('ar') || m.includes('slim') || m.includes('condicionado')) return 'ar';
  return null;
}

// Detecta pedido de imagem técnica e qual produto
function detectarImagemTecnica(mensagem) {
  const m = mensagem.toLowerCase();
  // Não ativa se for busca de assistência técnica
  if (m.includes('assistencia') || m.includes('assistência') || m.includes('ponto autorizado') || m.includes('autorizada')) return null;
  // Ativa com diversas formas de pedir imagem técnica
  const querImagem = m.includes('imagem tecni') || m.includes('imagem técni') ||
    m.includes('foto tecni') || m.includes('foto técni') ||
    m.includes('medida') || m.includes('dimensão') || m.includes('dimensao') ||
    (m.includes('tecni') && (m.includes('ar') || m.includes('geladeira') || m.includes('gerador') || m.includes('eco') || m.includes('slim')));
  if (!querImagem) return null;
  if (m.includes('eco') || m.includes('compact')) return 'ecocompact';
  if (m.includes('35') || m.includes('35l')) return 'geladeira-35l';
  if (m.includes('45') || m.includes('45l')) return 'geladeira-45l';
  if (m.includes('55') || m.includes('55l')) return 'geladeira-55l';
  if (m.includes('geladeira') || m.includes('frigobar')) {
    // Usuário pediu imagem técnica da geladeira mas não especificou o modelo
    return 'geladeira-sem-modelo';
  }
  if (m.includes('gerador')) return 'gerador';
  if (m.includes('slim') || m.includes('serie 2') || m.includes('série 2')) return 'ar';
  if (m.includes('condicionado') || (/\bar\b/.test(m) && !m.includes('geladeira'))) return 'ar-sem-modelo';
  return null;
}

// Índice de pastas em memória
let indiceDrive = [];
let ultimaAtualizacao = null;

// Paginação de assistência técnica por sessão
const paginacaoAssistencia = new Map();

// Sistema de contexto persistente entre mensagens
const contextosPendentes = new Map(); // sessionId -> { acao, dados, timestamp }

function salvarContexto(sessionId, acao, dados) {
  contextosPendentes.set(sessionId, { acao, dados, timestamp: Date.now() });
}

function obterContexto(sessionId) {
  const ctx = contextosPendentes.get(sessionId);
  if (!ctx) return null;
  // Expira após 2 minutos de inatividade
  if (Date.now() - ctx.timestamp > 2 * 60 * 1000) {
    contextosPendentes.delete(sessionId);
    return null;
  }
  return ctx;
}

function limparContexto(sessionId) {
  contextosPendentes.delete(sessionId);
} // sessionId -> { pontos, offset, local }

// Mapeamento de modelos para marcas
const MODELOS_MARCAS = {
  'hr': 'hyundai', 'hd': 'hyundai', 'hr 160': 'hyundai',
  'r450': 'scania', 'r500': 'scania', 's500': 'scania', 'p360': 'scania', 'g420': 'scania',
  'r410': 'scania', 'r480': 'scania', 'p310': 'scania', 'p340': 'scania',
  'fh': 'volvo', 'fm': 'volvo', 'fmx': 'volvo', 'vm': 'volvo', 'fh540': 'volvo',
  'actros': 'mercedes', 'axor': 'mercedes', 'atego': 'mercedes', 'accelo': 'mercedes',
  '1620': 'mercedes', '1933': 'mercedes', '2544': 'mercedes', '2646': 'mercedes',
  'tector': 'iveco', 'stralis': 'iveco', 'daily': 'iveco',
  'tgx': 'man', 'tgs': 'man', 'tgm': 'man',
  'cargo': 'ford', 'transit': 'ford',
  'constellation': 'volkswagen', 'delivery': 'volkswagen', 'worker': 'volkswagen',
  'ducato': 'fiat', 'fiorino': 'fiat', 'doblo': 'fiat', 'doblô': 'fiat',
  'bongo': 'kia',
  'master': 'renault', 'kangoo': 'renault',
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

async function buscarSubpastas(token, pastaId) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${pastaId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&pageSize=1000`;
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await response.json();
  return data.files || [];
}

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

function normIdx(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function buscarNoIndice(query) {
  if (indiceDrive.length === 0) return null;
  const q = normIdx(query);

  // Remove palavras genéricas para extrair só marca e modelo
  const stopWords = ['depoimento', 'deposito', 'foto', 'video', 'cliente', 'de', 'do', 'da', 'com', 'para', 'quero', 'ver'];
  const palavrasQuery = q.split(/\s+/).filter(p => p.length >= 2 && !stopWords.includes(p));

  // Identifica marca
  const marcasDiretas = ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'volkswagen', 'vw', 'hyundai', 'fiat', 'renault', 'isuzu', 'kia'];
  let marcaBusca = '';
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(normIdx(modelo))) { marcaBusca = marca; break; }
  }
  if (!marcaBusca) {
    for (const marca of marcasDiretas) {
      if (q.includes(marca)) { marcaBusca = marca === 'vw' ? 'volkswagen' : marca; break; }
    }
  }

  // Palavras que identificam o modelo (sem a marca e sem stopwords)
  const palavrasModelo = palavrasQuery.filter(p => !marcasDiretas.includes(p) && p !== marcaBusca);

  if (marcaBusca) {
    const pastasMarca = indiceDrive.filter(item => normIdx(item.marca).includes(marcaBusca));

    // Se tem palavras de modelo, tenta match específico
    if (palavrasModelo.length > 0) {

      // Match exato — todas as palavras do modelo aparecem no nome da pasta
      // Usa boundary para números (ex: "260" não deve dar match em "270")
      const exatos = pastasMarca.filter(item => {
        const nomeModelo = normIdx(item.modeloNome);
        return palavrasModelo.every(p => {
          // Para números, exige match exato (não parcial)
          if (/^\d+$/.test(p)) {
            return new RegExp('(^|[^\d])' + p + '([^\d]|$)').test(nomeModelo);
          }
          return nomeModelo.includes(p);
        });
      });
      if (exatos.length > 0) return exatos;

      // Match parcial — pelo menos uma palavra aparece (com boundary para números)
      const parciais = pastasMarca.filter(item => {
        const nomeModelo = normIdx(item.modeloNome);
        return palavrasModelo.some(p => {
          if (/^\d+$/.test(p)) {
            return new RegExp('(^|[^\d])' + p + '([^\d]|$)').test(nomeModelo);
          }
          return nomeModelo.includes(p);
        });
      });
      if (parciais.length > 0) return parciais;

      // Não achou modelo específico — avisa e retorna todas da marca
      pastasMarca._aviso = `Não encontrei pasta para "${palavrasModelo.join(' ')}" na ${marcaBusca}. Encontrei estas pastas:`;
      return pastasMarca.length > 0 ? pastasMarca : null;
    }

    // Sem modelo específico — retorna todas da marca
    if (pastasMarca.length > 0) {
      pastasMarca._aviso = `Encontrei as seguintes pastas para ${marcaBusca}:`;
      return pastasMarca;
    }
    return null;
  }

  // Sem marca conhecida — busca por palavras em qualquer campo (aceita singular/plural)
  const resultados = indiceDrive.filter(item => {
    const campos = [normIdx(item.marca), normIdx(item.marcaNome), normIdx(item.modelo), normIdx(item.modeloNome)];
    return palavrasQuery.some(p => {
      // Testa a palavra e variações (singular/plural)
      const variacoes = [p, p.endsWith('s') ? p.slice(0,-1) : p+'s', p.endsWith('os') ? p.slice(0,-2) : p];
      return campos.some(campo => variacoes.some(v => campo.includes(v)));
    });
  });

  if (resultados.length > 0) {
    resultados._aviso = `Entendi que você busca depoimentos no Drive. Encontrei ${resultados.length} pasta(s):`;
    return resultados;
  }
  return null;
}

async function buscarDadosPlanilha() {
  try {
    const abas = ['Ar-Condicionado Slim e S%C3%A9rie 2', 'Ar-Condicionado Eco Compact', 'Geladeira Port%C3%A1til', 'Gerador Digital 24V', 'Promo%C3%A7%C3%B5es Ativas', 'Formas de Pagamento'];
    let dados = '';
    for (const aba of abas) {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${aba}`;
      const response = await fetch(url);
      if (response.ok) dados += `\n=== ${decodeURIComponent(aba)} ===\n${await response.text()}\n`;
    }
    return dados;
  } catch (err) { return ''; }
}

// Haversine — distância em km entre dois pontos
function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Normaliza string para comparação
function norm(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Busca coordenadas de uma cidade no banco local
function buscarCoordenadas(nomeCidade, nomeEstado) {
  const cn = norm(nomeCidade);
  const en = norm(nomeEstado || '');
  let melhor = null;
  for (const c of CIDADES_BR) {
    const cc = norm(c.cidade);
    const ce = norm(c.estado);
    if (cc === cn && (!en || ce === en)) return c;
    if (cc === cn && !melhor) melhor = c;
    if (!melhor && (cc.includes(cn) || cn.includes(cc))) melhor = c;
  }
  return melhor;
}

async function buscarAssistenciaTecnica(query) {
  try {
    const nomes = [
      'PONTOS%20DE%20ASSIST%C3%8ANCIA%20T%C3%89CNICA%20%E2%80%94%20ESTILO%20AR',
      'Assist%C3%AAncia%20T%C3%A9cnica',
      'Assistencia%20Tecnica',
      'assistencia'
    ];
    let csv = null;
    for (const nome of nomes) {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${nome}`;
      const response = await fetch(url);
      if (response.ok) {
        const texto = await response.text();
        if (texto && texto.length > 10 && !texto.includes('error')) {
          csv = texto;
          break;
        }
      }
    }
    if (!csv) return null;

    function parseCSVLine(linha) {
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cols.push(current.trim());
      return cols;
    }

    const todasLinhas = csv.split('\n').filter(l => l.trim());

    // Busca a primeira linha que tenha dados reais (UF de 2 letras na coluna 3)
    const ufsValidas = ['ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'];
    let startIdx = 0;
    for (let i = 0; i < Math.min(todasLinhas.length, 10); i++) {
      const cols = parseCSVLine(todasLinhas[i]).map(c => c.replace(/^"|"$/g, '').trim());
      const uf = (cols[2] || '').toLowerCase().trim();
      if (ufsValidas.includes(uf)) {
        startIdx = i;
        break;
      }
    }

    const linhas = todasLinhas.slice(startIdx).filter(l => l.trim());
    const pontos = linhas.map(linha => {
      const cols = parseCSVLine(linha).map(c => c.replace(/^"|"$/g, '').trim());
      return { nome: cols[0]||'', cidade: cols[1]||'', estado: cols[2]||'', endereco: cols[3]||'', telefone: cols[4]||'' };
    }).filter(p => p.nome && p.nome.length > 1 && p.cidade && p.cidade.length > 1 && ufsValidas.includes(p.estado.toLowerCase().trim()));

    console.log('Total pontos lidos:', pontos.length);
    if (pontos.length > 0) console.log('Primeiro ponto:', JSON.stringify(pontos[0]));
    if (!pontos.length) return null;

    const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    const q = norm(query);

    const ESTADOS = {
      'acre':'ac','alagoas':'al','amapa':'ap','amapá':'ap','amazonas':'am',
      'bahia':'ba','baia':'ba','ceara':'ce','ceará':'ce',
      'distrito federal':'df','brasilia':'df','brasília':'df',
      'espirito santo':'es','espírito santo':'es','goias':'go','goiás':'go',
      'maranhao':'ma','maranhão':'ma','mato grosso do sul':'ms','mato grosso sul':'ms',
      'mato grosso':'mt','minas gerais':'mg','minas geras':'mg','minas gerai':'mg','minas':'mg',
      'para':'pa','pará':'pa','paraiba':'pb','paraíba':'pb','parana':'pr','paraná':'pr',
      'pernambuco':'pe','piaui':'pi','piauí':'pi',
      'rio de janeiro':'rj','rio janeiro':'rj',
      'rio grande do norte':'rn','rio grande norte':'rn',
      'rio grande do sul':'rs','rio grande sul':'rs',
      'rondonia':'ro','rondônia':'ro','roraima':'rr',
      'santa catarina':'sc','sta catarina':'sc',
      'sao paulo':'sp','são paulo':'sp','sao paul':'sp',
      'sergipe':'se','tocantins':'to'
    };
    const ufs = ['ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'];

    let ufBusca = null;
    if (ufs.includes(q)) { ufBusca = q; }
    else if (ESTADOS[q]) { ufBusca = ESTADOS[q]; }

    console.log('Query:', q, '| UF detectada:', ufBusca);
    console.log('Estados nos pontos:', pontos.map(p => norm(p.estado)));

    if (ufBusca) {
      const resultado = pontos.filter(p => norm(p.estado) === ufBusca);
      return resultado.length > 0
        ? { tipo: 'encontrado', pontos: resultado, local: ufBusca.toUpperCase() }
        : { tipo: 'nenhum' };
    }

    // Busca por cidade
    const resultado = pontos.filter(p => norm(p.cidade).includes(q) || q.includes(norm(p.cidade)));
    return resultado.length > 0
      ? { tipo: 'encontrado', pontos: resultado, local: query }
      : { tipo: 'nenhum' };

  } catch (err) {
    console.error('Erro assistência:', err);
    return null;
  }
}


app.post('/api/login', (req, res) => {
  const { senha } = req.body;
  if (senha === process.env.SENHA_ACESSO) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.get('/admin/atualizar-indice', async (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const total = await construirIndice();
    res.json({ sucesso: true, totalPastas: total, atualizadoEm: ultimaAtualizacao });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// BANCO DE CONHECIMENTO
// ============================================================

const CONTEXTO_BASE = `
Você é o Pedro, assistente interno de suporte de vendas da Estilo AR.
Você é um ser humano. Nunca diga que é IA ou robô. Se perguntarem, diga que é o Pedro do time de suporte da Estilo AR.

PÚBLICO: Você está falando com VENDEDORES da Estilo AR, não com clientes finais.
Suas respostas devem orientar o vendedor sobre o que indicar ao cliente dele.
Exemplo correto: "Para esse caminhão, você pode indicar ao cliente o Ar Slim Série 2."
Exemplo errado: "Para o seu caminhão, recomendo o Ar Slim Série 2."

JEITO DE SER:
- Simpático, direto e objetivo — o vendedor precisa de informação rápida
- Fala de forma natural e coloquial mas profissional
- Usa "você", "tá", "beleza", "ótimo", "claro", "pode deixar"
- Usa emojis com moderação
- Sempre responde em português brasileiro
- Respostas curtas e diretas ao ponto — sem enrolação

EMPRESA: Estilo AR | Tel: (34) 3293-8000 | Seg-Sex 08h-18h | www.estiloar.com.br | Uberlândia-MG

PROCESSOS INTERNOS DA EMPRESA:

CADASTRO DE PARCEIROS:
- Vídeo tutorial Cadastro PJ: https://youtu.be/bSyPlDA_BHc
- Vídeo tutorial Cadastro Pessoa Física: https://youtu.be/CO2m75GWmMA
- Ficha de cadastro (Excel): https://estiloar-suporte.onrender.com/FICHA%20DE%20CADASTRO.xlsx
- Quando alguém perguntar sobre cadastro, processo de cadastro, como cadastrar parceiro ou cliente, retorne os links acima conforme o tipo (PJ ou Pessoa Física)
- Se não especificar o tipo, retorne os dois links e a ficha

REGRAS CRÍTICAS:
- NUNCA invente informações, preços, depoimentos ou dados técnicos
- Se não tiver a informação no manual ou nos dados fornecidos, responda EXATAMENTE: "Não tenho essa informação disponível."
- NUNCA complete respostas com suposições ou conhecimento geral — use APENAS os dados deste contexto
- NUNCA busque informações em sites externos
- NUNCA mencione outras marcas ou concorrentes de produtos de ar-condicionado
- Use APENAS as informações fornecidas neste contexto
- Se não souber ou a informação não estiver explicitamente no contexto fornecido, responda EXATAMENTE: "Não tenho essa informação disponível no momento."
- NUNCA complete respostas com dados que não estejam explicitamente escritos neste contexto — mesmo que pareça óbvio ou provável
- Sobre preços: use APENAS os dados da planilha fornecida
- Quando informar preço de qualquer produto, SEMPRE apresente juntos: preço à vista, preço parcelado, condições de parcelamento E observações — mesmo que a observação esteja em branco, verifique a coluna. Nunca informe só um valor isolado
- NUNCA termine a resposta com sugestão de ligar para o telefone
- NUNCA termine com frases como "estou aqui para ajudar", "não hesite em perguntar" ou similares
- NUNCA faça perguntas no final da resposta
- NUNCA fale como se estivesse falando com o dono do caminhão — você está falando com o VENDEDOR
- NUNCA diga "seu caminhão", "sua cabine" — diga sempre "o caminhão do cliente", "a cabine do cliente"

REGRA DE VOLTAGEM PARA PREÇOS:
- O Ar Slim Série 2 e o Eco Compact existem em 12V e 24V, e cada voltagem pode ter preço diferente na planilha
- Se o vendedor perguntar o preço do Ar Slim, Ar Slim Série 2 ou Eco Compact SEM especificar a voltagem (12V ou 24V), você DEVE perguntar a voltagem ANTES de informar o preço
- Só informe o preço após o vendedor confirmar a voltagem
- Exemplo de resposta correta: "Qual a voltagem? 12V ou 24V?"

REGRA SOBRE FRASES DE INTRODUÇÃO:
- NUNCA inicie uma resposta sobre preço, valor ou informação de produto com frases do tipo "Para o caminhão do cliente, você pode indicar o [produto]..." quando a pergunta é apenas sobre preço/valor
- Se o vendedor perguntou diretamente sobre preço ou valor, vá direto ao ponto com o preço
- A frase de indicação de produto só deve aparecer quando o vendedor está perguntando qual produto indicar para um caminhão específico

REGRA PARA PROCESSOS INTERNOS:
- Quando o vendedor perguntar sobre qualquer processo interno (devolução, garantia, cadastro, pedido, ficha, nota fiscal, etc.), NUNCA invente a resposta
- Oriente o vendedor a acessar a seção "Processos Internos" da página, onde estão todos os links, documentos e vídeos disponíveis
- Resposta padrão: "Essa informação está na seção **Processos Internos** da página! Lá você encontra os documentos, fichas e vídeos necessários. Role a página para cima para acessar."

REGRA PARA RECOMENDAÇÃO DE AR POR CAMINHÃO:
- Os caminhões listados no guia têm regras específicas — siga EXATAMENTE o guia
- Para caminhão NÃO listado no guia: recomende o Ar Slim Série 2, SEM explicar o produto, SEM inventar detalhes de instalação
- Resposta padrão para caminhão não listado: "Para o [modelo], você pode indicar ao cliente o Ar Slim Série 2. Para detalhes de instalação, a equipe técnica pode avaliar."
- NUNCA associe modelos a marcas erradas

MARCAS E MODELOS DE CAMINHÕES DO MERCADO BRASILEIRO (para reconhecimento — NÃO invente regras de instalação para estes):

VOLKSWAGEN Worker: 8.120, 8.150E, 9.150E, 13.170E, 13.180, 13.180E, 15.170E, 15.180, 15.180E, 15.180 4x4, 17.180, 17.220, 17.220 Tractor, 17.250E, 24.220, 24.250E, 26.220, 26.260E, 31.260E
VOLKSWAGEN Delivery: 4.150, 5.140, 6.160, 8.150, 9.150, 9.170, 10.160, 11.180, 13.180
VOLKSWAGEN Constellation: 17.230, 19.320, 24.250, 24.280, 25.360, 26.390, 26.420, 30.330
VOLKSWAGEN Antigos: 11.130, 13.130, 14.140, 16.170, 18.310

MERCEDES-BENZ Accelo: 715, 815, 1016, 1316
MERCEDES-BENZ Atego: 1419, 1719, 1726, 2426, 2430
MERCEDES-BENZ Axor: 1933, 2036, 2544, 2644
MERCEDES-BENZ Actros: 2045, 2546, 2651, 2653
MERCEDES-BENZ Antigos: 1113, 1313, 1519, 1620, 1634, 1935, 1938, 1941

VOLVO VM: 210, 270, 330
VOLVO FM: 370, 410, 460
VOLVO FH: 420, 460, 500, 540 (ano faz diferença — perguntar sempre)
VOLVO Antigos: FH12, FH16, NH12

SCANIA P: 250, 280, 320
SCANIA G: 360, 400
SCANIA R: 440, 450, 500, 540
SCANIA S: 500, 540
SCANIA Antigos: 111, 112, 113H, 114, 124

IVECO Daily: 30-130, 35-150, 45-170, 55-180
IVECO Tector: 9-190, 11-190, 17-280, 24-280
IVECO Hi-Way: 440, 480, 540
IVECO S-Way: 480, 540
IVECO Stralis: 380, 410, 440, 480, 560

DAF CF: 310, 410, 450
DAF XF: 480, 530

FORD Cargo: 712, 815, 1317, 1519, 1719, 1723, 1933, 2042, 2842

HYUNDAI: HR, HD (65, 78, 120, 170)
KIA: Bongo (K2500, K2700, K3000)
`;

const SECOES = {

  ar_slim_geral: `
PRODUTO: AR-CONDICIONADO 100% ELÉTRICO SLIM SÉRIE 2
Modelos: 12V e 24V | Peso: 40 kg
Dimensões: 97 x 85,8 x 15 cm
Abertura instalação: mín 460x400mm / máx 545x937mm
Gás: R134a (460g) | Óleo: RH68 | Classe climática: T1
Garantia: 3 meses — guardar embalagem por 30 dias
Suporte: (34) 99641-1025 | Seg-Sex 08h-18h
`,

  ar_slim_consumo: `
ESPECIFICAÇÕES E CONSUMO — AR SLIM SÉRIE 2:
Capacidade de refrigeração: 12V=2.150W | 24V=2.560W
Capacidade média: 9.500 BTUs
Fluxo de ar evaporador: 400m³/h | Condensador: 2.000m³/h

Consumo por modo:
Econômico: 12V=240W/20A | 24V=288W/12A
Automático: 12V=600W/50A | 24V=840W/35A
Turbo: 12V=720W/60A | 24V=960W/40A

Recomendação: alternador mínimo 12V = 85 a 90 amperes
Bateria mínima para instalação: 150A | Alternador mínimo para instalação: 90A (VALORES OFICIAIS — não alterar)
Bateria mínima para instalação: 150A | Alternador mínimo: 90A
`,

  ar_slim_operacao: `
OPERAÇÃO — AR SLIM SÉRIE 2:
- Ligar/desligar: pressionar botão de energia
- Velocidade ventilador: 5 níveis (1 a 5)
- Iluminação: pressão rápida liga/desliga | pressão longa = oscilação vertical
- Modos: Econômico, Automático, Turbo
- Temperatura: ajuste de 1°C | faixa 5°C a 32°C
- Ver temp entrada: segurar botão temperatura | temp saída: segurar novamente
- Proteção baixa tensão: segurar 6 segundos, ajustar com botão temperatura
- Padrão: 12V=10,5V | 24V=20,5V | Ajustável: 9V a 28V
- Quando bateria atingir mínimo: equipamento desliga automaticamente, display mostra LU

MODOS:
- TURBO: capacidade máxima, maior consumo
- AUTOMÁTICO: ajusta automaticamente conforme temperatura configurada
- ECONÔMICO: reduz consumo, ideal com veículo desligado

CONTROLE REMOTO: ligar/desligar, temperatura, velocidade, modos, oscilação horizontal e vertical, temp entrada, tensão
`,

  ar_slim_erros: `
ERROS — AR SLIM SÉRIE 2:
E2: Superaquecimento por baixa dissipação → verificar compressor e ventilador
E3: Bloqueio do sistema → verificar compressor, válvula de expansão e pressão
E4: Baixa tensão → verificar bateria e conexões
E5: Sobrecorrente do controlador → verificar controlador e dissipação
E6: Falha no ventilador → verificar travamento ou substituir
E7: Falha no compressor (perda de fase) → verificar chicote e compressor
E8: Problema de pressão → verificar gás e condensador
E9: Sobrecorrente do ventilador → verificar rolamento ou travamento
E10: Falha de pressão → verificar sistema de gás
E11: Sobrecarga → reiniciar sistema
LU: Baixa tensão → verificar bateria ou placa
SHr: Falha no sensor ou painel → testar e substituir componente
OPE: Sensor desconectado ou cabo rompido → verificar conexão

AR NÃO GELA:
Pressão normal: baixa 0,2-0,4 MPa | alta 10-15 MPa
- Alta pressão alta: ventilador com falha ou condensador sujo → limpar/substituir
- Alta pressão baixa: falta refrigerante → reabastecer
- Alta e baixa fora do normal: compressor danificado → substituir

UNIDADE EXTERNA NÃO FUNCIONA:
- Verificar modo de refrigeração ativo no painel
- Verificar circuito elétrico (fio verde entre painel e controlador)
- Verificar controlador

OBSERVAÇÕES:
- Diferença de temperatura menor que 5°C = falha de refrigeração
- Temp saída abaixo de 2°C = ativa modo degelo | acima de 6°C = volta ao normal
`,

  ar_slim_manutencao: `
MANUTENÇÃO — AR SLIM SÉRIE 2:
A cada 3 meses verificar: conexões elétricas, terminais, cabos, parafusos e oxidação
Não instalar em inclinação superior a 30 graus
Tetos irregulares: verificar vedação e usar selante se necessário
Instalação deve ser feita por profissional qualificado
`,

  ar_slim_instalacao: `
INSTALAÇÃO — AR SLIM SÉRIE 2:
1. Remover teto solar e limpar área
2. Aplicar vedação impermeável
3. Posicionar equipamento centralizado
4. Fixar com 4 porcas M10
5. Instalar acabamento decorativo
6. Fio VERMELHO → positivo (+) | Fio PRETO → negativo (-)
DRENO: mangueira deve ter queda natural; se não tiver, não usar a mangueira
CHICOTE: ligar direto na bateria, não modificar chicote original
`,


  instalacao_por_caminhao: `
MODELOS VOLKSWAGEN WORKER:
Leves: 8.120, 8.150E, 9.150E
Médios: 13.170E, 13.180, 13.180E, 15.170E, 15.180, 15.180E, 15.180 4x4
Semi-pesados: 17.180, 17.220, 17.220 Tractor, 17.250E
Pesados: 24.220, 24.250E, 26.220, 26.260E, 31.260E

MODELOS VOLKSWAGEN DELIVERY:
Antigos: 5.140, 8.150, 9.150, 10.160, 13.180
Nova geração: 4.150, 6.160, 9.170, 11.180, 13.180

ATENÇÃO — WORKER vs DELIVERY:
O código numérico NÃO identifica sozinho o caminhão (ex: 13.180 existe no Worker E no Delivery).
Worker = uso pesado, robusto | Delivery = uso urbano, conforto
Quando cliente mencionar só o número (ex: 8.150), sempre perguntar se é Worker ou Delivery.
Nomenclatura: primeiro número = toneladas | segundo número = potência em cv

GUIA DE INSTALAÇÃO POR MODELO DE CAMINHÃO:

ATENÇÃO: Responda APENAS com base nas informações abaixo.
Para caminhões não listados aqui: recomende sempre o Ar Slim Série 2, sem inventar detalhes de instalação.

ECO COMPACT — recomendado para cabines MENORES:
✅ Volvo FH: NÃO precisa cortar o teto
⚠️ VW Worker: precisa corte de aproximadamente 1,5cm de cada lado
⚠️ VW Delivery: precisa corte de aproximadamente 1,5cm de cada lado

SLIM e SLIM SÉRIE 2 — recomendados para cabines MAIORES e maioria dos caminhões:
✅ Maioria dos caminhões: NÃO precisa cortar
⚠️ Volvo FH: PRECISA cortar o teto
⚠️ VW Worker: PRECISA cortar o teto
⚠️ VW Delivery: PRECISA cortar o teto

CAMINHÕES PEQUENOS — Hyundai HR e Kia Bongo:
⚠️ NÃO possuem abertura no teto de fábrica
⚠️ Qualquer modelo de ar: necessário cortar o teto

CASO ESPECIAL — Volvo FH a partir de 2016:
⚠️ Possui teto solar de fábrica — instalação mais complexa
⚠️ Encaminhar para análise especializada antes da venda

REGRAS DE DECISÃO:
- HR / Bongo → sempre cortar, qualquer modelo
- VW Worker / Delivery → ECO Compact: corte leve | Slim Série 2: corte necessário
- Volvo FH (até 2015) → ECO Compact: sem corte | Slim Série 2: corte necessário
- Volvo FH 2016+ → análise especializada
- Qualquer outro caminhão não listado → Ar Slim Série 2 recomendado, equipe técnica avalia instalação
`,

  ar_eletrico: `
PRODUTOS DE AR-CONDICIONADO ESTILO AR:
- Ar-Condicionado Slim Série 2 (12V e 24V) — para cabines maiores e maioria dos caminhões
- Ar-Condicionado Eco Compact — para cabines menores
`,

  eco_compact: `
PRODUTO: AR-CONDICIONADO ECO COMPACT
Modelos: 12V e 24V | Dimensões: 980 x 700 x 150 mm
Peso: informação não disponível no manual
Abertura mínima instalação: 600 x 300 mm
Garantia: 3 meses | Gás: R134a (460g) | Lubrificante: RH68
Faixa de temperatura: 5°C a 32°C | Classe climática: T1

ESPECIFICAÇÕES TÉCNICAS:
Capacidade de refrigeração: 24V=2.000W | 12V=1.800W
Potência elétrica: 24V=950W | 12V=750W
Fluxo de ar evaporador: 400m³/h | Condensador: 1.800m³/h
Inclinação frontal máxima: 20°
Bateria mínima para instalação: 150A | Alternador mínimo: 90A

OPERAÇÃO:
- Ligar/desligar: pressionar rapidamente o botão
- Velocidade: 5 níveis (1 a 5)
- Iluminação: pressão rápida liga/desliga | pressão longa = oscilação vertical
- Modos: Econômico, Refrigeração, Refrigeração Forte
- Temperatura: ajuste de 1°C | faixa 5°C a 32°C
- Ver temp entrada: segurar botão temperatura | temp saída: segurar novamente
- Proteção baixa tensão: segurar 6 segundos, ajustar com botão temperatura
- Padrão: 24V=21,5V | 12V=10,5V

ERROS:
E2: Proteção de corrente → verificar pressão e ventilador
E3: Bloqueio → bateria fraca ou pressão alta
E4: Subtensão → bateria descarregada
E5: Falha do controlador → reiniciar ou substituir
E6: Falha ventilador condensador → curto ou mau contato
E7: Falha do compressor → terminais queimados ou curto
E8: Proteção temperatura compressor → verificar pressão
E9: Problema no pressostato → verificar pressão ou interruptor
LU: Baixa tensão → verificar bateria
OPE: Sensor aberto → verificar cabos ou conectores
SHr: Curto no sensor → substituir sensor

INSTALAÇÃO:
1. Remover claraboia e limpar área
2. Aplicar vedação impermeável
3. Posicionar unidade e fixar com 4 porcas M8
4. Instalar painel decorativo
5. Fio VERMELHO → positivo (+) | Fio PRETO → negativo (-)

BATERIA E ALTERNADOR (INFORMAÇÃO OFICIAL — NÃO ALTERAR):
- Bateria mínima para instalação: 150A
- Alternador mínimo para instalação: 90A
- NUNCA informar valor diferente de 150A para bateria e 90A para alternador

MANUTENÇÃO:
- Limpeza com água e detergente neutro | pano úmido na carcaça
- Não usar gasolina, solventes ou lavadora de alta pressão
- Manter ventilação livre | distância mínima ao redor: 100mm
`,


  processos_internos: `
PROCESSOS INTERNOS — ESTILO AR
Esta seção contém materiais de treinamento interno para a equipe de vendas.

CADASTRO DE PARCEIROS:
- Cadastro Pessoa Física: https://youtu.be/CO2m75GWmMA
- Cadastro Pessoa Jurídica: https://youtu.be/bSyPlDA_BHc
`,

  processos_internos: `
PROCESSOS INTERNOS — ESTILO AR
Materiais de treinamento para a equipe de vendas.

1. CADASTRO DE PARCEIROS
Procedimento para cadastrar novos parceiros (pessoa física ou jurídica).
- Vídeo Pessoa Física: https://youtu.be/CO2m75GWmMA
- Vídeo Pessoa Jurídica: https://youtu.be/bSyPlDA_BHc
- Ficha de Cadastro: https://estiloar-suporte.onrender.com/FICHA DE CADASTRO.xlsx

2. PROCESSO DE GARANTIAS
Como proceder em casos de garantia de produtos.
- Ficha de Garantia: https://estiloar-suporte.onrender.com/FICHA GARANTIA.xls
- Orientações para Emissão de Nota: https://estiloar-suporte.onrender.com/ORIENTAÇÕES  PARA  EMISSÃO DE NOTA  PARA  GARANTIA  OU REMESSA  PARA CONSERTO.pdf
- Apresentação Pós-Vendas: https://estiloar-suporte.onrender.com/APRESENTAÇÃO PÓS-VENDAS.pdf

3. PROCESSO DE DEVOLUÇÃO
Como realizar devoluções de produtos.
- Ficha de Devolução: https://estiloar-suporte.onrender.com/FICHA DEVOLUÇÃO.xls
- Orientações para Emissão de Nota: https://estiloar-suporte.onrender.com/ORIENTAÇÕES PARA EMISSAO DE NOTA DE DEVOLUÇÃO.pdf

4. TIRAR PEDIDO
Como realizar pedidos de vendas no sistema.
- Vídeo — Como Fazer Pedidos: https://youtu.be/m0-8V-SlEes
`,

  geladeira_geral: `
PRODUTO: GELADEIRA PORTÁTIL
Modelos: 35L, 45L e 55L
Tensão: DC 12V/24V ou AC 100~240V
Resfriamento até -20°C | Potência: 60W | Ruído: <45dB
Faixa de temperatura: -20°C a +20°C
Display digital | Duas zonas independentes (esquerda e direita)
Garantia: 3 meses
`,

  geladeira_dimensoes: `
DIMENSÕES E PESO DA GELADEIRA:
- Modelo 35L: 647 x 400 x 441mm | Peso: 16,14 kg
- Modelo 45L: 647 x 400 x 506mm | Peso: 16,5 kg
- Modelo 55L: 647 x 400 x 571mm | Peso: 17,2 kg
`,

  geladeira_operacao: `
COMO USAR A GELADEIRA:
- Ligar/desligar: pressionar rapidamente o botão liga/desliga
- Config temperatura caixa esquerda: pressionar + e botão config por 3 segundos
- Config temperatura caixa direita: pressionar - e botão config por 3 segundos
- Não é possível desligar as duas caixas ao mesmo tempo
- Modos: HH (resfriamento rápido, padrão) e ECO (economia)
- Proteção bateria: segurar botão config por 3 segundos, selecionar Baixo/Médio/Alto
- Conversão Celsius/Fahrenheit: segurar 3 segundos até E1, navegar até E5
- Restaurar fábrica: desligada, segurar 3 segundos até E1, pressionar + e - juntos por 3 segundos
`,

  geladeira_bateria: `
PROTEÇÃO DE BATERIA DA GELADEIRA:
DC 12V - Baixo: inicia 8,5V / sai 10,9V | Médio: inicia 10,1V / sai 11,4V | Alto: inicia 11,1V / sai 12,4V
DC 24V - Baixo: inicia 21,3V / sai 21,7V | Médio: inicia 22,3V / sai 22,7V | Alto: inicia 24,3V / sai 24,7V
`,

  geladeira_temperatura: `
TEMPERATURAS RECOMENDADAS:
Bebidas: 5°C | Frutas: 5~8°C | Verduras: 3~10°C | Comida preparada: 4°C
Vinho: 10°C | Gelados: -10°C | Carne: -18°C
`,

  geladeira_erros: `
ERROS DA GELADEIRA:
F1 - Baixa tensão: desligar interruptor de proteção
F2 - Sobrecarga ventilador: desligar 5 min e religar. Se persistir: pós-venda
F3 - Compressor protegendo: desligar 5 min e religar. Se persistir: pós-venda
F4 - Velocidade compressor baixa: desligar 5 min e religar. Se persistir: pós-venda
F5 - Temperatura alta no compressor: local ventilado, desligar 5 min. Se persistir: pós-venda
F6 - Controlador sem parâmetros: desligar 5 min e religar. Se persistir: pós-venda
F7/F8 - Sensor temperatura anormal: contatar pós-venda
`,

  geladeira_problemas: `
PROBLEMAS COMUNS DA GELADEIRA:
Não funciona: verificar botão liga/desliga, plugue, fusível e fonte
Temperatura muito alta: não abrir com frequência, não colocar alimentos quentes
Alimentos congelando: temperatura muito baixa, aumentar a temperatura
Som de água correndo: condensação natural — NORMAL
Gotas de água na porta: condensação natural — NORMAL
Compressor mais alto ao iniciar: estabiliza depois — NORMAL
`,

  geladeira_manutencao: `
LIMPEZA E MANUTENÇÃO DA GELADEIRA:
- Desconectar o plugue antes de limpar
- Limpar com pano macio úmido, secar depois
- Não usar limpador abrasivo
DESCONGELAR: desligar, retirar itens, abrir tampa, aguardar degelo, drenar água, secar
`,

  geladeira_seguranca: `
PRECAUÇÕES DA GELADEIRA:
- Após desembalar: aguardar 6 horas antes de ligar
- Inclinação máxima uso prolongado: menor que 5°
- Ventilação: traseira ≥20cm | lateral ≥10cm
`,

  gerador_geral: `
PRODUTO: GERADOR DIGITAL 24V
Modelos: LE-3000i e LE-3000i Pro | Peso: 20 kg
Tensão nominal DC: 28V (±1V) | Potência de saída: até 1.800W
Combustível: gasolina sem chumbo (tanque 4L)
Óleo: SJ10W-40 padrão API tipo SE (capacidade 0,4L)
Motor: monocilíndrico, 4 tempos, arrefecimento por ar forçado
Voltagem mínima para partida: 17,5V
Garantia: 3 meses
`,

  gerador_seguranca: `
SEGURANÇA DO GERADOR:
- NUNCA usar em ambientes fechados: monóxido de carbono pode causar morte
- Parar o motor ANTES de reabastecer
- Gerador NÃO vem com óleo da fábrica: NUNCA ligar sem colocar óleo primeiro
`,

  gerador_operacao: `
COMO USAR O GERADOR:
- Ligar imediatamente: interruptor para "Ligar"
- Modo automático: liga quando bateria cai abaixo de 23V/24V/25V (configurável)
- Para quando geração cai abaixo de 800W
- Fio vermelho → positivo (+) | Fio preto → negativo (-)
- NUNCA inverter os polos
`,

  gerador_luzes: `
LUZES INDICADORAS DO GERADOR:
Verde normal: operação normal
Verde 3x: modo automático ativo
Vermelho 2x: curto-circuito → verificar fios trifásicos
Vermelho 3x: anormalidade linha de fase → verificar fios e ponte retificadora
4 vermelhos 3 verdes: anomalia inicialização → verificar fusível 25A
Vermelho 5x: sobretensão → bateria acima de 31V
Vermelho 6x: detecção velocidade → verificar fio de extinção
Vermelho 7x: subtensão bateria → bateria descarregada (abaixo de 8V)
3 vermelhos 2 verdes: corrente alta → verificar terminais e rotor
6 vermelhos 1 verde: motor não liga → verificar carburador, vela, fio de extinção
7 vermelhos 1 verde: subtensão na geração → verificar sobrecarga e fios
Luz óleo acesa: óleo insuficiente → adicionar imediatamente
`,

  gerador_manutencao: `
MANUTENÇÃO DO GERADOR:
Sempre: verificar combustível e óleo antes de usar
Mensal/20h: verificar e adicionar óleo | limpar filtro de ar
Trimestral/50h: substituir óleo | limpar vela de ignição
100h: ajustar válvulas | limpar depósito de combustível

SUBSTITUIÇÃO DO ÓLEO: aquecer motor, desligar, inclinar para drenar, recolocar na horizontal, adicionar 0,4L de SJ10W-40
`,

  gerador_problemas: `
MOTOR DO GERADOR NÃO ARRANCA:
1. Sem combustível → reabastecer
2. Filtro entupido → limpar filtro de combustível
3. Carburador entupido → limpar carburador
4. Óleo baixo → adicionar óleo
5. Vela com carbono ou umidade → limpar e secar a vela
6. Problema no sistema de ignição → contatar fabricante

ARMAZENAMENTO: até 1 mês=nenhuma prep | 1-2 meses=trocar gasolina | 2 meses-1 ano=drenar carburador | mais de 1 ano=drenar internamente
`,

};

function selecionarContexto(mensagem) {
  const m = mensagem.toLowerCase();
  const secoes = [CONTEXTO_BASE];

  if (m.includes('geladeira') || m.includes('frigobar') || m.includes('refrigerador') || m.match(/\b(35|45|55)l?\b/)) {
    secoes.push(SECOES.geladeira_geral);
    if (m.match(/\b(35|45|55)\b/) || m.includes('peso') || m.includes('dimens') || m.includes('medida') || m.includes('tamanho'))
      secoes.push(SECOES.geladeira_dimensoes);
    if (m.includes('f1') || m.includes('f2') || m.includes('f3') || m.includes('f4') || m.includes('f5') || m.includes('f6') || m.includes('f7') || m.includes('f8') || m.includes('erro') || m.includes('falha'))
      secoes.push(SECOES.geladeira_erros);
    if (m.includes('não funciona') || m.includes('nao funciona') || m.includes('problema') || m.includes('som') || m.includes('congelando'))
      secoes.push(SECOES.geladeira_problemas);
    if (m.includes('bateria') || m.includes('tensão') || m.includes('voltagem') || m.includes('proteção'))
      secoes.push(SECOES.geladeira_bateria);
    if (m.includes('temperatura') || m.includes('carne') || m.includes('fruta') || m.includes('bebida'))
      secoes.push(SECOES.geladeira_temperatura);
    if (m.includes('como usar') || m.includes('ligar') || m.includes('desligar') || m.includes('configurar') || m.includes('modo'))
      secoes.push(SECOES.geladeira_operacao);
    if (m.includes('limpar') || m.includes('limpeza') || m.includes('desgel') || m.includes('guardar'))
      secoes.push(SECOES.geladeira_manutencao);
    if (secoes.length === 2) { secoes.push(SECOES.geladeira_operacao); secoes.push(SECOES.geladeira_dimensoes); }
  }

  else if (m.includes('gerador') || m.includes('le-3000') || m.includes('le3000') || m.includes('combustível') || m.includes('combustivel')) {
    secoes.push(SECOES.gerador_geral);
    if (m.includes('luz') || m.includes('pisca') || m.includes('vermelho') || m.includes('verde') || m.includes('erro') || m.includes('falha'))
      secoes.push(SECOES.gerador_luzes);
    if (m.includes('não arranca') || m.includes('nao arranca') || m.includes('não liga') || m.includes('nao liga') || m.includes('problema') || m.includes('armazenamento'))
      secoes.push(SECOES.gerador_problemas);
    if (m.includes('óleo') || m.includes('oleo') || m.includes('manutenção') || m.includes('manutencao') || m.includes('filtro') || m.includes('vela') || m.includes('trocar'))
      secoes.push(SECOES.gerador_manutencao);
    if (m.includes('como usar') || m.includes('ligar') || m.includes('automático') || m.includes('bateria') || m.includes('bluetooth'))
      secoes.push(SECOES.gerador_operacao);
    if (m.includes('segurança') || m.includes('perigo') || m.includes('fechado'))
      secoes.push(SECOES.gerador_seguranca);
    if (secoes.length === 2) { secoes.push(SECOES.gerador_operacao); secoes.push(SECOES.gerador_seguranca); }
  }

  else if (
    m.includes('ar') || m.includes('condicionado') || m.includes('elétrico') || m.includes('eletrico') ||
    m.includes('eco compact') || m.includes('ecocompact') || m.includes('slim') ||
    m.includes('instalação') || m.includes('instalacao') || m.includes('caminhão') || m.includes('caminhao') ||
    m.includes('cortar') || m.includes('corte') || m.includes('teto') ||
    m.includes('volvo') || m.includes('worker') || m.includes('delivery') || m.includes('bongo') ||
    m.includes('constellation') || m.includes('fh') || m.includes('scania') || m.includes('mercedes') ||
    m.includes('iveco') || m.includes('volkswagen') || m.includes('vw') || m.includes('hyundai') ||
    m.includes('kia') || m.includes('ford') || m.includes('man') ||
    m.includes('recomend') || m.includes('indicad') || m.includes('qual modelo')
  ) {
    if (m.includes('eco') || m.includes('compact')) {
      secoes.push(SECOES.eco_compact);
      secoes.push(SECOES.instalacao_por_caminhao);
    } else if (
      m.includes('instalar') || m.includes('instalação') || m.includes('instalacao') ||
      m.includes('corte') || m.includes('cortar') || m.includes('teto') ||
      m.includes('caminhão') || m.includes('caminhao') || m.includes('volvo') ||
      m.includes('worker') || m.includes('delivery') || m.includes('bongo') ||
      m.includes('recomend') || m.includes('indicad') || m.includes('qual') ||
      m.includes('scania') || m.includes('mercedes') || m.includes('iveco') ||
      m.includes('volkswagen') || m.includes('vw') || m.includes('hyundai') ||
      m.includes('kia') || m.includes('ford') || m.includes('man') ||
      m.includes('constellation') || m.includes('fh') || m.includes('modelo')
    ) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.instalacao_por_caminhao);
    } else if (m.includes('erro') || m.includes('falha') || /e\d+/.test(m) || m.includes(' e2') || m.includes(' e3') || m.includes(' e4') || m.includes(' e5') || m.includes(' e6') || m.includes(' e7') || m.includes(' e8') || m.includes(' e9') || m.includes(' e10') || m.includes(' e11') || m.includes('lu') || m.includes('shr') || m.includes('ope') || m.includes('não gela') || m.includes('nao gela') || m.includes('nao esta gelando') || m.includes('não está gelando')) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_erros);
    } else if (m.includes('consumo') || m.includes('bateria') || m.includes('ampere') || m.includes('watt') || m.includes('btu') || m.includes('capacidade') || m.includes('refriger') || m.includes('potencia') || m.includes('potência') || m.includes('fluxo') || m.includes('corrente')) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_consumo);
    } else if (m.includes('manut') || m.includes('limpar')) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_manutencao);
    } else if (m.includes('como usar') || m.includes('ligar') || m.includes('modo') || m.includes('temperatura') || m.includes('velocidade')) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_operacao);
    } else {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_operacao);
      secoes.push(SECOES.ar_slim_consumo);
    }
  }

  else if (m.includes('processo') || m.includes('interno') || m.includes('treinamento') ||
    m.includes('cadastro') || m.includes('parceiro') || m.includes('pessoa fisica') ||
    m.includes('pessoa juridica') || m.includes('pf') || m.includes('pj') ||
    m.includes('devolucao') || m.includes('devolução') || m.includes('devolver') ||
    m.includes('garantia') || m.includes('pos-venda') || m.includes('pos venda') ||
    m.includes('ficha') || m.includes('nota fiscal') || m.includes('emissao de nota') ||
    m.includes('tirar pedido') || m.includes('fazer pedido') || m.includes('pedido de venda')) {
    secoes.push(SECOES.processos_internos);
  }

  else {
    secoes.push(SECOES.ar_eletrico);
    secoes.push(SECOES.geladeira_geral);
    secoes.push(SECOES.gerador_geral);
  }

  return secoes.join('\n');
}


app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Inválido' });

  try {
    const mensagemOriginal = messages[messages.length - 1]?.content || '';

    // Normaliza erros comuns de digitação antes de processar
    function normalizarMensagem(msg) {
      return msg.toLowerCase()
        // Assistência técnica
        .replace(/ass+is+t[eêe]n+c[aio]+s?/gi, 'assistencia')
        .replace(/asist[eê]ncia/gi, 'assistencia')
        .replace(/assist[eê]ncia/gi, 'assistencia')
        // Depoimento
        .replace(/dep[ou]iment[oa]s?/gi, 'depoimento')
        .replace(/dep[ou]iment[oa]s?/gi, 'depoimento')
        // Geladeira
        .replace(/gelad[ei]+ra/gi, 'geladeira')
        .replace(/gelade[iy]ra/gi, 'geladeira')
        // Gerador
        .replace(/gerad[ou]r/gi, 'gerador')
        // Ar condicionado
        .replace(/ar\s*cond[iy]c[iy]on[ae]do/gi, 'ar condicionado')
        // Imagem técnica
        .replace(/im[ae]g[ei]ns?\s+t[eé]cn[iy]c[ao]s?/gi, 'imagem tecnica')
        .replace(/t[eé]cn[iy]c[ao]s?/gi, 'tecnica')
        // Slim série
        .replace(/sl[iy]m/gi, 'slim')
        .replace(/s[eé]r[iy][eé]/gi, 'serie')
        // Eco compact
        .replace(/[eé]co\s*comp[ae]ct/gi, 'eco compact')
        // Volvo FH
        .replace(/fh/gi, 'fh')
        // Erros gerais de acentuação
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        // ─── Normalização de modelos de caminhão ──────────────────────────────────────────────
        // Converte modelos digitados SEM ponto para o formato COM ponto dos arrays.
        // Exemplos: "15170" -> "15.170" | "15170e" -> "15.170e" | "13180" -> "13.180"
        //           "17220" -> "17.220" | "24250e" -> "24.250e" | "8150"  -> "8.150"
        // Protege anos (20xx) com marcacao temporaria antes de converter.
        .replace(/\b(20\d{2})\b/g, '__ANO__$1__ANO__')
        .replace(/\b(\d{1,2})(\d{3})(e2?|4x4|e)?\b/gi, function(match, ton, pot, suf) {
          return ton + '.' + pot + (suf ? suf.trim().toLowerCase() : '');
        })
        .replace(/__ANO__(\d{4})__ANO__/g, '$1');
    }

    const ultimaMensagem = normalizarMensagem(mensagemOriginal);
    const sessionId = (req.ip || 'default') + '_chat';
    const RODAPE = '\n\nPosso ajudar em algo mais? 😊';

    // ============================================================
    // SISTEMA DE CONTEXTO PERSISTENTE — verifica ação pendente
    // ============================================================
    const ctxPendente = obterContexto(sessionId);
    if (ctxPendente) {
      const { acao, dados } = ctxPendente;
      const m = ultimaMensagem;
      let respondeuContexto = false;
      let respostaPendente = null;

      // Contexto: perguntou modelo do ar (imagem técnica ou foto)
      if (acao === 'perguntou_modelo_ar') {
        const ehSlim = m.includes('slim') || m.includes('serie 2') || m.includes('serie2');
        const ehEco = m.includes('eco') || m.includes('compact');
        if (ehSlim || ehEco) {
          respondeuContexto = true;
          const produto = ehEco ? 'ecocompact' : 'ar';
          const nome = ehEco ? 'Eco Compact' : 'Slim Série 2';
          if (dados.tipo === 'imagem') {
            const imagens = IMAGENS_TECNICAS[produto];
            const links = imagens.map((img, i) => `🖼️ **Imagem ${i+1}**: ${img}`).join('\n');
            respostaPendente = `Aqui estão as imagens técnicas do **${nome}**:\n\n${links}${RODAPE}`;
          } else if (dados.tipo === 'foto') {
            const fotos = FOTOS_PRODUTOS[produto];
            const links = fotos.map((img, i) => `📷 **Foto ${i+1}**: ${img}`).join('\n');
            respostaPendente = `Aqui estão as fotos do **${nome}**:\n\n${links}${RODAPE}`;
          }
        }
      }

      // Contexto: perguntou modelo da geladeira
      else if (acao === 'perguntou_modelo_geladeira') {
        const eh35 = m.includes('35');
        const eh45 = m.includes('45');
        const eh55 = m.includes('55');
        if (eh35 || eh45 || eh55) {
          respondeuContexto = true;
          const modelo = eh35 ? 'geladeira-35l' : eh45 ? 'geladeira-45l' : 'geladeira-55l';
          const nomeModelo = eh35 ? '35L' : eh45 ? '45L' : '55L';
          if (dados.tipo === 'imagem') {
            const imagens = IMAGENS_TECNICAS[modelo];
            const links = imagens.map((img, i) => `🖼️ **Imagem ${i+1}**: ${img}`).join('\n');
            respostaPendente = `Aqui estão as imagens técnicas da **Geladeira ${nomeModelo}**:\n\n${links}${RODAPE}`;
          } else if (dados.tipo === 'foto') {
            const fotos = FOTOS_PRODUTOS['geladeira'];
            const links = fotos.map((img, i) => `📷 **Foto ${i+1}**: ${img}`).join('\n');
            respostaPendente = `Aqui estão as fotos da **Geladeira Portátil**:\n\n${links}${RODAPE}`;
          }
        }
      }

      // Contexto: perguntou cidade para assistência técnica
      else if (acao === 'perguntou_cidade_assistencia') {
        const queryFinal = ultimaMensagem.replace(/[?!.,;:]/g, '').trim();
        if (queryFinal.length > 1) {
          respondeuContexto = true;
          limparContexto(sessionId);
          const resultado = await buscarAssistenciaTecnica(queryFinal);
          if (!resultado || resultado.tipo === 'nenhum' || !resultado.pontos || resultado.pontos.length === 0) {
            return res.json({ reply: `Não temos assistência técnica cadastrada em **${queryFinal}**.${RODAPE}` });
          }
          const lista = resultado.pontos.map(p =>
            `📍 **${p.nome}**\n📌 ${p.cidade} - ${p.estado}\n🏠 ${p.endereco}\n📞 ${p.telefone}`
          ).join('\n\n');
          return res.json({ reply: `Encontrei pontos de assistência em **${queryFinal}**:\n\n${lista}${RODAPE}` });
        }
      }

      // Contexto: perguntou marca para depoimento
      else if (acao === 'perguntou_marca_depoimento') {
        if (m.length > 1) {
          respondeuContexto = true;
          limparContexto(sessionId);
          const resultados = buscarNoIndice(ultimaMensagem);
          if (resultados && resultados.length > 0) {
            const aviso = resultados._aviso || `Encontrei ${resultados.length} pasta(s) no Drive:`;
            const links = resultados.map(r => `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`).join('\n');
            return res.json({ reply: `${aviso}\n\n${links}${RODAPE}` });
          } else {
            return res.json({ reply: `Não encontrei depoimentos para essa marca ou modelo.${RODAPE}` });
          }
        }
      }

      if (respondeuContexto) {
        limparContexto(sessionId);
        if (respostaPendente) return res.json({ reply: respostaPendente });
      } else {
        limparContexto(sessionId); // mudou de assunto — limpa contexto
      }
    }

    // Verifica se em qualquer parte do histórico da conversa há menção ao FH
    const historicoCompleto = messages.map(m => (m.content || '').toLowerCase()).join(' ');
    const contextoTemFH = historicoCompleto.includes('volvo fh') || / fh[ .,!?]/.test(historicoCompleto) ||
                          historicoCompleto.includes(' fh') || historicoCompleto.endsWith('fh') ||
                          historicoCompleto.startsWith('fh ');

    // Detecta mensagem curta contendo um ano (ex: "2019", "e o 2019", "e para o 2019", "e o de 2019?")
    const anoNaMensagem = ultimaMensagem.match(/(20\d{2})/);
    const mensagemCurta = anoNaMensagem && ultimaMensagem.trim().length <= 40 &&
                          /^(e\s*)?(para\s*)?(o\s*)?(de\s*)?(o\s*)?(modelo\s*)?(ano\s*)?[^a-z]*(20\d{2})[^a-z]*$/i.test(ultimaMensagem.trim());
    if (anoNaMensagem && (mensagemCurta || ultimaMensagem.trim().length <= 8) && contextoTemFH) {
      const ano = parseInt(anoNaMensagem[1]);
      if (ano >= 2016) {
        return res.json({ reply: `O Volvo FH ${ano} possui teto solar de fábrica, o que torna a instalação mais complexa. Oriente seu cliente a passar por uma análise da nossa equipe técnica antes de fechar. 😊` });
      } else {
        return res.json({ reply: `Para o Volvo FH ${ano}, você pode indicar ao cliente o Eco Compact — não precisa cortar o teto. Se preferir o Slim Série 2, será necessário cortar o teto. 😊` });
      }
    }

    // Detecta Volvo FH com ano na mesma mensagem
    const fhMatch = ultimaMensagem.match(/fh\s*(20\d{2})/i) || ultimaMensagem.match(/(20\d{2})\s*fh/i);
    if (fhMatch) {
      const ano = parseInt(fhMatch[1]);
      if (ano >= 2016) {
        return res.json({ reply: `O Volvo FH ${ano} possui teto solar de fábrica, o que torna a instalação mais complexa. Oriente seu cliente a passar por uma análise da nossa equipe técnica antes de fechar. 😊` });
      } else {
        return res.json({ reply: `Para o Volvo FH ${ano}, você pode indicar ao cliente o Eco Compact — não precisa cortar o teto. Se preferir o Slim Série 2, será necessário cortar o teto. 😊` });
      }
    }

    // Detecta Volvo FH sem ano — pergunta o ano (só se NÃO for pedido de depoimento)
    const mencionaFH = ultimaMensagem.includes('volvo fh') || ultimaMensagem.includes(' fh ') ||
                       ultimaMensagem.includes(' fh') || ultimaMensagem.endsWith('fh') ||
                       ultimaMensagem.startsWith('fh ');
    const temAno = /20\d{2}/.test(ultimaMensagem);
    const ehDepoimento = ['depoimento', 'foto de cliente', 'video de cliente', 'vídeo de cliente', 'quem instalou', 'ja instalou', 'já instalou', 'cliente que instalou'].some(p => ultimaMensagem.includes(p));
    if (mencionaFH && !temAno && !ehDepoimento) {
      return res.json({ reply: `Para o Volvo FH, o ano faz diferença na instalação. Qual o ano do caminhão do seu cliente? 😊` });
    }

    // Detecta Worker e Delivery — responde direto sem passar pelo modelo
    // Modelos numéricos do Worker
    const modelosWorker = ['8.120','8.150e','9.150e','13.170e','13.170','13.180','13.180e','15.170e','15.170','15.180','15.180e','15.180 4x4','17.180','17.220','17.220 tractor','17.250e','24.220','24.250e','26.220','26.260e','31.260e'];
    // Modelos numéricos do Delivery (nova geração — diferente do Worker)
    const modelosDelivery = ['4.150','5.140','6.160','8.150','9.150','9.170','10.160','11.180','13.180'];
    // Modelos ambíguos (existem nos dois)
    const modelosAmbiguos = ['8.150','9.150','10.160','13.180','15.180','17.220'];

    const normMsg = ultimaMensagem.replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const mencionaWorker = ultimaMensagem.includes('worker') || ultimaMensagem.includes('vw worker') || ultimaMensagem.includes('volkswagen worker') ||
      modelosWorker.some(m => ultimaMensagem.includes(m)) ||
      modelosWorker.some(m => ultimaMensagem.includes(m.replace(/e$/, '').replace(/e2$/, '')));
    const mencionaDelivery = ultimaMensagem.includes('delivery') || ultimaMensagem.includes('vw delivery') || ultimaMensagem.includes('volkswagen delivery') ||
      modelosDelivery.some(m => ultimaMensagem.includes(m));
    // Modelo ambíguo mencionado sem especificar linha
    const mencionaAmbiguo = !mencionaWorker && !mencionaDelivery &&
      modelosAmbiguos.some(m => ultimaMensagem.includes(m)) &&
      (ultimaMensagem.includes('vw') || ultimaMensagem.includes('volkswagen') || ultimaMensagem.includes('worker') || ultimaMensagem.includes('delivery') ||
       modelosWorker.some(m => ultimaMensagem.includes(m.split('.')[0])) ||
       modelosAmbiguos.some(m => ultimaMensagem.replace(/\s/g,'').includes(m.replace('.',''))));
    const modelosConstellation = ['17.230','19.320','24.250','24.280','25.360','26.390','26.420','30.330'];
    const mencionaConstellation = ultimaMensagem.includes('constellation') ||
      modelosConstellation.some(m => ultimaMensagem.includes(m)) ||
      modelosConstellation.some(m => ultimaMensagem.includes(m.replace(/\./, '')));
    const mencionaHR = ultimaMensagem.includes(' hr') || ultimaMensagem.includes('hyundai hr') || ultimaMensagem.endsWith('hr');
    const mencionaBongo = ultimaMensagem.includes('bongo') || ultimaMensagem.includes('kia bongo');
    const ehPerguntaInstalacao = !ehDepoimento && (ultimaMensagem.includes('qual') || ultimaMensagem.includes('modelo') || ultimaMensagem.includes('ar') || ultimaMensagem.includes('indicar') || ultimaMensagem.includes('instalar') || ultimaMensagem.includes('melhor') || ultimaMensagem.includes('recomend'));

    if (mencionaAmbiguo && ehPerguntaInstalacao) {
      const modelo = modelosAmbiguos.find(m => ultimaMensagem.includes(m));
      return res.json({ reply: `O modelo **${modelo}** existe tanto na linha **Worker** quanto na **Delivery**. Para indicar o ar correto, confirme com o cliente qual é a linha do caminhão:\n\n• **Worker ${modelo}** ou **Delivery ${modelo}**?\n\nAmbos precisam de corte no teto para instalação de qualquer modelo de ar.` });
    }

    if ((mencionaWorker || mencionaDelivery) && ehPerguntaInstalacao) {
      const nome = mencionaWorker ? 'VW Worker' : 'VW Delivery';
      return res.json({ reply: `Para o **${nome}**, você pode indicar ao cliente:\n\n• **Eco Compact** — necessário corte leve de aproximadamente 1,5cm de cada lado do teto\n• **Slim Série 2** — necessário cortar o teto` });
    }

    if (mencionaConstellation && ehPerguntaInstalacao) {
      return res.json({ reply: `Para o **VW Constellation**, você pode indicar ao cliente o **Slim Série 2**. Para detalhes de instalação, a equipe técnica pode avaliar. 😊` });
    }

    if ((mencionaHR || mencionaBongo) && ehPerguntaInstalacao) {
      const nome = mencionaHR ? 'Hyundai HR' : 'Kia Bongo';
      return res.json({ reply: `Para o **${nome}**, não há abertura no teto de fábrica. Para qualquer modelo de ar-condicionado será necessário cortar o teto. Recomendamos avaliar com o cliente antes de fechar a venda.` });
    }

    // Detecta qualquer modelo numérico de caminhão não-VW mencionado isoladamente
    // (Mercedes, Scania, Ford Cargo, etc.) — responde com fallback hardcoded, sem passar pelo LLM
    const modeloNumericoMatch = ultimaMensagem.match(/\b(\d{1,2}\.\d{3}[a-z0-9]*)\b/i);
    const naoEhVW = !mencionaWorker && !mencionaDelivery && !mencionaAmbiguo;
    if (modeloNumericoMatch && naoEhVW && ehPerguntaInstalacao) {
      const modeloDetectado = modeloNumericoMatch[1].toUpperCase();
      return res.json({ reply: `Para o **${modeloDetectado}**, você pode indicar ao cliente o **Ar Slim Série 2**. Para detalhes de instalação, a equipe técnica pode avaliar. 😊` });
    }

    // Detecta pergunta sobre bateria e alternador — responde direto sem passar pelo modelo
    const perguntaBateria = /bater[ia]+|alternador/i.test(ultimaMensagem);
    if (perguntaBateria) {
      const sobreEco = ultimaMensagem.includes('eco') || ultimaMensagem.includes('compact');
      const sobreSlim = ultimaMensagem.includes('slim') || ultimaMensagem.includes('serie') || ultimaMensagem.includes('série');
      const sobreAr = sobreEco || sobreSlim || ultimaMensagem.includes('ar') || ultimaMensagem.includes('condicionado');

      // Verifica contexto do histórico se a mensagem for curta
      let produto = '';
      if (sobreEco) produto = 'Eco Compact';
      else if (sobreSlim) produto = 'Slim Série 2';
      else if (sobreAr || ultimaMensagem.trim().length < 20) {
        // Busca no histórico recente
        const historico = messages.slice(-6).map(m => (m.content||'').toLowerCase()).join(' ');
        if (historico.includes('eco') || historico.includes('compact')) produto = 'Eco Compact';
        else if (historico.includes('slim') || historico.includes('serie')) produto = 'Slim Série 2';
        else produto = 'Ar-Condicionado';
      }

      if (produto) {
        const temBateria = /bater[ia]+/i.test(ultimaMensagem);
        const temAlternador = /alternador/i.test(ultimaMensagem);
        let resposta = '';
        if (temBateria && temAlternador) {
          resposta = `Para o **${produto}**, a bateria mínima é de **150A** e o alternador mínimo é de **90A**.`;
        } else if (temBateria) {
          resposta = `Para o **${produto}**, a bateria mínima para instalação é de **150A**.`;
        } else if (temAlternador) {
          resposta = `Para o **${produto}**, o alternador mínimo para instalação é de **90A**.`;
        }
        if (resposta) return res.json({ reply: resposta });
      }
    }

    // Detecta pedido de foto do produto
    const produtoFoto = detectarFotoProduto(ultimaMensagem);
    if (produtoFoto) {
      const fotos = FOTOS_PRODUTOS[produtoFoto];
      if (fotos && fotos.length > 0) {
        const nomeProduto = produtoFoto === 'ecocompact' ? 'Eco Compact' :
          produtoFoto === 'geladeira' ? 'Geladeira Portátil' :
          produtoFoto === 'gerador' ? 'Gerador Digital 24V' : 'Ar Slim Série 2';
        const links = fotos.map((img, i) => `📷 **Foto ${i+1}**: ${img}`).join('\n');
        return res.json({ reply: `Entendi que você quer as fotos do **${nomeProduto}**. Aqui estão:\n\n${links}${RODAPE}` });
      }
    }

    // Detecta busca de assistência técnica
    const palavrasAssistencia = [
      // Correto
      'assistência técnica', 'assistencia tecnica',
      'assistência em', 'assistencia em',
      'quero assistencia', 'quero assistência', 'quero uma assistencia', 'quero uma assistência', 'preciso de assistencia', 'preciso de assistência', 'busco assistencia', 'busco assistência',
      'ponto autorizado', 'ponto de assistência', 'ponto de assistencia',
      'autorizada', 'onde conserto', 'onde consertar',
      'assistência mais perto', 'assistencia mais perto',
      'técnico autorizado', 'tecnico autorizado',
      'tem assistencia', 'tem assistência',
      'assistencia mais proxima', 'assistência mais próxima',
      'assistencia proximo', 'assistencia próximo',
      // Erros comuns de digitação
      'asistencia', 'asistência', 'assistenca', 'assistanca',
      'asistencia tecnica', 'asistência técnica',
      'assistencia tecnica', 'assistência tecnica',
      'assitencia', 'assitência', 'asistenci',
      'assistecia', 'assistenci', 'assistencai',
      'asssitencia', 'asssistencia', 'assisttencia', 'assistenica', 'assitencia', 'assisencia',
      'tecnico autorizado', 'tecnico autorizdo',
      'ponto autorzado', 'ponto autorizdo',
      'onde conseto', 'onde conserto', 'consertar',
      'assistenci em', 'asistencia em', 'assitencia em'
    ];
    // Detecção robusta — inclui variações com erros de digitação via regex
    const buscaAssistencia = palavrasAssistencia.some(p => ultimaMensagem.includes(p)) ||
      /ass[i|í]s?t[eê]n?c[i|í]a/i.test(ultimaMensagem) ||
      /as+is+t[eê]/i.test(ultimaMensagem) ||
      /ponto\s+auto/i.test(ultimaMensagem);

    if (buscaAssistencia) {
      // Extrai cidade da mensagem removendo palavras irrelevantes
      const stopWords = [
        // palavras de assistência
        'assistencia', 'assistência', 'tecnica', 'técnica', 'ponto', 'autorizado', 'autorizada',
        'asistencia', 'assitencia', 'assistenca', 'tecnico', 'técnico',
        'conserto', 'consertar', 'onde', 'conseto',
        // preposições e artigos
        'em', 'de', 'do', 'da', 'no', 'na', 'para', 'por', 'ao', 'aos', 'as', 'a',
        'o', 'os', 'e', 'ou', 'um', 'uma', 'uns', 'umas',
        // pronomes e verbos comuns
        'me', 'te', 'se', 'nos', 'voce', 'você', 'meu', 'minha', 'seu', 'sua',
        'tem', 'ter', 'ha', 'há', 'teria', 'seria', 'esta', 'está',
        // verbos de pedido
        'quero', 'queria', 'preciso', 'precisaria', 'gostaria', 'busco', 'procuro',
        'pode', 'dar', 'de', 'falar', 'dizer', 'mostrar', 'mostra', 'mostre',
        'indicar', 'indica', 'indique', 'encontrar', 'achar', 'ver', 'veja',
        'buscar', 'procurar', 'pesquisar', 'checar', 'verificar',
        // palavras genéricas
        'ola', 'olá', 'oi', 'qual', 'quais', 'alguma', 'algum', 'algumas', 'alguns',
        'favor', 'por', 'mais', 'perto', 'proximo', 'próximo', 'proxima', 'próxima',
        'existe', 'existem', 'tem', 'temos', 'possui', 'possuem',
        'porfavor', 'pfv', 'pf', 'obrigado', 'obrigada',
        // outras variações
        'info', 'informacao', 'informação', 'informacoes', 'informações',
        'dados', 'contato', 'lista', 'listagem'
      ];
      // Extrai localidade — remove tudo exceto o nome da cidade/estado
      const normLocal = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      // Remove todas as palavras de pedido e assistência, preservando só a localidade
      let queryFinal = normLocal(ultimaMensagem)
        // Remove variações de assistência técnica
        .replace(/ass[a-z]*[ei][a-z]*c[a-z]*/gi, '')
        .replace(/t[eé]cn[a-z]*/gi, '')
        .replace(/ponto\s*autor[a-z]*/gi, '')
        // Remove verbos e palavras de pedido (não remove de/da/do pois podem ser parte do nome da cidade)
        .replace(/\b(quero|quer|queria|preciso|precisa|gostaria|busco|procuro|temos|tem|existe|existem|possui|possuem|ha|há|pode|poderia|me|um|uma|uns|umas|favor|pfv|pf|oi|ola|qual|quais|onde|algum|alguma)\b/gi, '')
        // Remove saudações
        .replace(/\b(bom\s*dia|boa\s*tarde|boa\s*noite|por\s*favor|obrigado|obrigada)\b/gi, '')
        // Remove pontuação
        .replace(/[?!.,;:]/g, '')
        // Remove preposição do início
        .replace(/^\s*(em|no|na|para|do|da|a|o)\s+/i, '')
        // Remove espaços duplos
        .replace(/\s+/g, ' ')
        .trim();


      // Detecta pergunta sobre quantidade total
      const perguntaQuantidade = /quant(as|os|o|a)|total|quantidad/i.test(ultimaMensagem);
      if (perguntaQuantidade) {
        const todos = await buscarAssistenciaTecnica('todos');
        const total = todos && todos.pontos ? todos.pontos.length : 0;
        // Busca total real lendo planilha sem filtro
        try {
          const nomes = ['PONTOS%20DE%20ASSIST%C3%8ANCIA%20T%C3%89CNICA%20%E2%80%94%20ESTILO%20AR','Assist%C3%AAncia%20T%C3%A9cnica','Assistencia%20Tecnica','assistencia'];
          let totalReal = 0;
          for (const nome of nomes) {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${nome}`;
            const r = await fetch(url);
            if (r.ok) {
              const txt = await r.text();
              if (txt && txt.length > 10 && !txt.includes('error')) {
                const ufsV = ['ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'];
                const linhas = txt.split('\n').filter(l => {
                  const cols = l.split(',');
                  return cols.length >= 3 && ufsV.includes((cols[2]||'').replace(/"/g,'').trim().toLowerCase());
                });
                totalReal = linhas.length;
                break;
              }
            }
          }
          return res.json({ reply: `Temos **${totalReal} ponto${totalReal !== 1 ? 's' : ''}** de assistência técnica cadastrados no total.` });
        } catch(e) {
          return res.json({ reply: `Não consegui contar os pontos no momento.` });
        }
      }

      // Detecta pedido de listar todas as assistências
      const pedirTodas = /cite\s*todas|lista\s*todas|mostra\s*todas|todas\s*as\s*assist|listar\s*todas/i.test(ultimaMensagem);
      if (pedirTodas) {
        return res.json({ reply: `Temos muitos pontos cadastrados! Para facilitar, busque por estado ou cidade. Por exemplo:\n\n• *"assistência em SP"*\n• *"assistência em MG"*\n• *"assistência em Campinas"*` });
      }

      const resultado = await buscarAssistenciaTecnica(queryFinal);

      if (!resultado || resultado.tipo === 'nenhum' || !resultado.pontos || resultado.pontos.length === 0) {
        return res.json({ reply: `Entendi que você está buscando assistência técnica em **${queryFinal}**. Não temos nenhum ponto cadastrado para essa localidade.` });
      }

      const PAGINA = 6;
      const sessionId = req.ip || 'default';
      const paginaKey = sessionId + '_' + queryFinal;

      // Verifica se é pedido de "mais" resultados
      const pedirMais = /mais|continua|proximo|próximo|resto|restante|seguinte|next/i.test(ultimaMensagem);

      let offset = 0;
      if (pedirMais && paginacaoAssistencia.has(paginaKey)) {
        offset = paginacaoAssistencia.get(paginaKey).offset;
      } else {
        // Nova busca — reseta paginação
        paginacaoAssistencia.set(paginaKey, { offset: 0, local: queryFinal });
      }

      const todos = resultado.pontos;
      const pagina = todos.slice(offset, offset + PAGINA);
      const novoOffset = offset + pagina.length;
      const restantes = todos.length - novoOffset;

      // Atualiza offset para próxima página
      paginacaoAssistencia.set(paginaKey, { offset: novoOffset, local: queryFinal });

      const lista = pagina.map(p =>
        `📍 **${p.nome}**\n📌 ${p.cidade} - ${p.estado}\n🏠 ${p.endereco}\n📞 ${p.telefone}`
      ).join('\n\n');

      let intro = '';
      if (offset === 0) {
        intro = todos.length <= PAGINA
          ? `Entendi que você está buscando assistência técnica em **${queryFinal}**. Encontrei ${todos.length} ponto${todos.length !== 1 ? 's' : ''}:`
          : `Entendi que você está buscando assistência técnica em **${queryFinal}**. Encontrei ${todos.length} pontos, mostrando os primeiros ${pagina.length}:`;
      } else {
        intro = `Continuando... mostrando mais ${pagina.length} ponto${pagina.length !== 1 ? 's' : ''}:`;
      }

      let rodape = '';
      if (restantes > 0) {
        rodape = `\n\n_Ainda há **${restantes} ponto${restantes !== 1 ? 's' : ''}** restante${restantes !== 1 ? 's' : ''}. Digite **"assistência em ${queryFinal} mais"** para ver os próximos._`;
      } else if (offset > 0) {
        rodape = `\n\n_Esses são todos os pontos disponíveis para **${queryFinal}**._`;
      }

      return res.json({ reply: `${intro}\n\n${lista}${rodape}` });
    }


    // Detecta pedido de imagem técnica
    const produtoTecnico = detectarImagemTecnica(ultimaMensagem);
    if (produtoTecnico) {
      if (produtoTecnico === 'geladeira-sem-modelo') {
        return res.json({ reply: `Qual o modelo da geladeira? **35L**, **45L** ou **55L**?` });
      }
      if (produtoTecnico === 'ar-sem-modelo') {
        return res.json({ reply: `Qual o modelo do ar-condicionado? **Slim Série 2** ou **Eco Compact**?` });
      }
      const imagens = IMAGENS_TECNICAS[produtoTecnico];
      if (imagens && imagens.length > 0) {
        const nomeProduto = produtoTecnico.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const links = imagens.map((img, i) => `\uD83D\uDDBC\uFE0F **Imagem ${i+1}**: ${img}`).join('\n');
        return res.json({ reply: `Entendi que você quer as imagens técnicas de **${nomeProduto}**. Aqui estão:\n\n${links}${RODAPE}` });
      } else {
        return res.json({ reply: `Entendi que você quer imagens técnicas, mas não encontrei imagens para esse produto.${RODAPE}` });
      }
    }

    // Detecta busca de depoimentos/Drive
    const palavrasDepoimento = ['depoimento', 'foto de cliente', 'video de cliente', 'vídeo de cliente', 'quem instalou', 'ja instalou', 'já instalou', 'cliente que instalou', 'referencia de cliente', 'referência de cliente'];
    const buscaDrive = palavrasDepoimento.some(p => ultimaMensagem.includes(p));

    if (buscaDrive) {
      if (indiceDrive.length === 0) {
        try { await construirIndice(); } catch (err) {
          return res.json({ reply: `No momento não consigo acessar os depoimentos. 😊` });
        }
      }
      if (indiceDrive.length === 0) {
        return res.json({ reply: `No momento não consigo acessar os depoimentos. 😊` });
      }
      const resultados = buscarNoIndice(ultimaMensagem);
      if (resultados && resultados.length > 0) {
        const aviso = resultados._aviso || `Encontrei ${resultados.length} pasta(s) no Drive:`;
        const links = resultados.map(r => `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`).join('\n');
        return res.json({ reply: `${aviso}\n\n${links}` });
      } else {
        return res.json({ reply: `Não encontrei depoimentos para essa marca ou modelo. 😊` });
      }
    }

    const dadosPlanilha = await buscarDadosPlanilha();
    const contextoRelevante = selecionarContexto(ultimaMensagem);
    const contexto = contextoRelevante + `\n========\nDADOS DA PLANILHA (preços/promoções/pagamento):\n${dadosPlanilha || 'Indisponível'}`;

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
    if (!response.ok) {
      const errMsg = data.error?.message || '';
      // Mensagem amigável para rate limit
      if (response.status === 429 || errMsg.includes('Rate limit') || errMsg.includes('rate limit')) {
        return res.json({ reply: `⏳ O assistente está recebendo muitas perguntas ao mesmo tempo. Aguarde alguns segundos e tente novamente!` });
      }
      return res.json({ reply: `⚠️ Não consegui processar sua pergunta agora. Tente novamente em instantes!` });
    }
    res.json({ reply: data.choices?.[0]?.message?.content || 'Sem resposta.' });

  } catch (err) {
    console.error(err);
    res.json({ reply: `⚠️ Ocorreu um erro inesperado. Tente novamente em instantes!` });
  }
});

setInterval(async () => {
  try { await construirIndice(); } catch (err) { console.error(err); }
}, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor na porta ${PORT}`);
  try { await construirIndice(); } catch (err) { console.error(err); }
});
