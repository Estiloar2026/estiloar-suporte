const express = require('express');
const cors = require('cors');


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
  // Ativa com palavras de foto/imagem + produto (todas as variações)
  const querFoto = m.includes('foto') || m.includes('fotos') || m.includes('imagem') || m.includes('imagens') ||
    m.includes('ver o produto') || m.includes('ver o ar') || m.includes('ver a geladeira') || m.includes('ver o gerador') ||
    m.includes('ver o eco') || m.includes('ver o slim');
  if (!querFoto) return null;
  if (m.includes('geladeira') || m.includes('frigobar')) return 'geladeira';
  if (m.includes('gerador')) return 'gerador';
  // Ar: só retorna modelo específico se o usuário mencionou explicitamente
  if (m.includes('eco') || m.includes('compact')) return 'ecocompact';
  if (m.includes('slim') || m.includes('serie 2') || m.includes('série 2')) return 'ar';
  // Ar genérico sem modelo -> retorna sinal para mostrar botões de escolha
  const temReferenciaArGenerico = m.includes(' ar') || m.includes('ar ') || m.endsWith('ar') || m.startsWith('ar') || m.includes('condicionado') || m.includes('ar-condicionado');
  const semOutroProduto = !m.includes('geladeira') && !m.includes('gerador');
  if (temReferenciaArGenerico && semOutroProduto) return 'ar-sem-modelo-foto';
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
    // Se pediu medidas/dimensões sem modelo — retorna sinal especial para mostrar tabela
    if (m.includes('medida') || m.includes('dimens') || m.includes('tamanho') || m.includes('peso')) return 'geladeira-dimensoes';
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

 // sessionId -> { pontos, offset, local }

// Mapeamento de modelos para marcas
const MODELOS_MARCAS = {
  'hr': 'hyundai', 'hd': 'hyundai', 'hr 160': 'hyundai',
  'r450': 'scania', 'r500': 'scania', 's500': 'scania', 'p360': 'scania', 'g420': 'scania',
  'r410': 'scania', 'r480': 'scania', 'p310': 'scania', 'p340': 'scania', 'ntg': 'scania', 'p400': 'scania', 'r400': 'scania', 's450': 'scania', 'r540': 'scania',
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

// Normaliza números removendo pontos e espaços (ex: "8 150", "8.150", "8150" → "8150")
function normNum(s) {
  return (s || '').replace(/[\s.]/g, '');
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
  let modeloDetectadoViaMapa = ''; // modelo identificado via MODELOS_MARCAS (ex: "1620" -> mercedes)
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(normIdx(modelo))) { marcaBusca = marca; modeloDetectadoViaMapa = normIdx(modelo); break; }
  }
  if (!marcaBusca) {
    for (const marca of marcasDiretas) {
      if (q.includes(marca)) { marcaBusca = marca === 'vw' ? 'volkswagen' : marca; break; }
    }
  }

  // Palavras que identificam o modelo (sem a marca e sem stopwords)
  // Se a marca foi detectada via MODELOS_MARCAS, inclui o modelo detectado nas palavras de busca
  let palavrasModelo = palavrasQuery.filter(p => !marcasDiretas.includes(p) && p !== marcaBusca);
  if (modeloDetectadoViaMapa && !palavrasModelo.includes(modeloDetectadoViaMapa)) {
    palavrasModelo = [modeloDetectadoViaMapa, ...palavrasModelo];
  }

  if (marcaBusca) {
    const pastasMarca = indiceDrive.filter(item => normIdx(item.marca).includes(marcaBusca));

    // Se tem palavras de modelo, tenta match específico
    if (palavrasModelo.length > 0) {

      // Match exato — todas as palavras do modelo aparecem no nome da pasta
      // Para números: normaliza removendo pontos e espaços antes de comparar
      const exatos = pastasMarca.filter(item => {
        const nomeModelo = normIdx(item.modeloNome);
        const nomeModeloSemSep = normNum(nomeModelo);
        return palavrasModelo.every(p => {
          if (/^[\d][\d\s.]*[\d]$|^\d+$/.test(p)) {
            const pSemSep = normNum(p);
            // Compara sem separadores e exige boundary
            return new RegExp('(^|[^\d])' + pSemSep + '([^\d]|$)').test(nomeModeloSemSep);
          }
          return nomeModelo.includes(p);
        });
      });
      if (exatos.length > 0) return exatos;

      // Match parcial — pelo menos uma palavra aparece
      const parciais = pastasMarca.filter(item => {
        const nomeModelo = normIdx(item.modeloNome);
        const nomeModeloSemSep = normNum(nomeModelo);
        return palavrasModelo.some(p => {
          if (/^[\d][\d\s.]*[\d]$|^\d+$/.test(p)) {
            const pSemSep = normNum(p);
            return new RegExp('(^|[^\d])' + pSemSep + '([^\d]|$)').test(nomeModeloSemSep);
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

  // Sem marca conhecida — busca por palavras em qualquer campo (aceita singular/plural e variações numéricas)
  const resultados = indiceDrive.filter(item => {
    const campos = [normIdx(item.marca), normIdx(item.marcaNome), normIdx(item.modelo), normIdx(item.modeloNome)];
    const camposSemSep = campos.map(c => normNum(c));
    return palavrasQuery.some(p => {
      const variacoes = [p, p.endsWith('s') ? p.slice(0,-1) : p+'s', p.endsWith('os') ? p.slice(0,-2) : p];
      // Para números, usa normNum para ignorar pontos e espaços
      if (/^[\d][\d\s.]*[\d]$|^\d+$/.test(p)) {
        const pSemSep = normNum(p);
        return camposSemSep.some(campo => new RegExp('(^|[^\d])' + pSemSep + '([^\d]|$)').test(campo));
      }
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



// Endpoint mapa de assistências técnicas
const PONTOS_ASSISTENCIA = [{"nome": "DHR AR-CONDICIONADO AUTOMOTIVO", "cidade": "DESCALVADO", "estado": "SP", "endereco": "RUA FRANCISCO RAVAZI 147, JARDIM DO LAGO", "telefone": "(19) 9 9247-6334", "lat": -21.9022, "lng": -47.6189}, {"nome": "DISTAK AR CONDICIONADO E ACESSORIOS", "cidade": "SALVADOR", "estado": "BA", "endereco": "RUA DIRETA DA PALESTINA 02, RODOVIA BR 324, BAIRRO PALESTINA, SALVADOR - BA, CEP 41308-025", "telefone": "(71) 9 9187-0876", "lat": -12.9714, "lng": -38.5014}, {"nome": "CARVALHO AR CONDICIONADO", "cidade": "JUATUBA", "estado": "MG", "endereco": "RODOVIA MG 050, Nº 370, BAIRRO CANAA, JUATUBA - MG, CEP 35675-000", "telefone": "(31) 9 8599-4621", "lat": -19.9594, "lng": -44.4289}, {"nome": "LUCAS AUTO AR TRANSPORTES E SERVICOS LTDA", "cidade": "ITUMBIARA", "estado": "GO", "endereco": "AVENIDA ERNESTO ROCHA, Nº 152, SALA 1, BAIRRO RESIDENCIAL DONA GURI RODRIGUES, ITUMBIARA - GO, CEP: 75528-203", "telefone": "(64) 9 9203-6340", "lat": -18.4189, "lng": -49.2158}, {"nome": "DENIVALDO", "cidade": "MONTE CARMELO", "estado": "MG", "endereco": "AVENIDA BRASIL NORTE, Nº 380 , BAIRRO PLANALTO, MONTE CARMELO - MG, CEP 38500-000", "telefone": "(34) 9828-7519", "lat": -18.7275, "lng": -47.5006}, {"nome": "TIAGO MASSULA", "cidade": "CONTAGEM", "estado": "MG", "endereco": "AVENIDA FRANCISCO FIRMO DE MATOS, Nº 1075, BAIRRO ELDORADO, CONTAGEM - MG, CEP 32280-270", "telefone": "(31) 98791-1724", "lat": -19.9317, "lng": -44.0536}, {"nome": "PAULO MARCELO DE SILVEIRA ABREU AUTO PECAS LTDA", "cidade": "COXIM", "estado": "MS", "endereco": "AVENIDA GASPAR RIES COELHO, Nº 1740, BAIRRO VILA SÃO PAULO, COXIM - MS, 79400-000", "telefone": "(67) 9963-1737", "lat": -18.5067, "lng": -54.7589}, {"nome": "OFICINA DO FRIO", "cidade": "TERESINA", "estado": "PI", "endereco": "RUA MANOEL DA PAZ, Nº 1261, BAIRRO VERMELHA, TERESINA - PI, 64019-280", "telefone": "(86) 9922-8594", "lat": -5.0892, "lng": -42.8019}, {"nome": "GUIGUIZAO AUTO-ELETRICA E ACESSORIOS", "cidade": "TUCUMÃ", "estado": "PA", "endereco": "RUA MOGNO, Nº 151, BAIRRO MONTE CASTELO, TUCUMA - PA, CEP 68385-000", "telefone": "(94) 9136-1031", "lat": -6.7447, "lng": -51.1539}, {"nome": "JC AR CONDICIONADO", "cidade": "JUAZEIRO DO NORTE", "estado": "CE", "endereco": "AVENIDA AILTON GOMES, Nº 1082, BAIRRO FRANCISCANOS, JUAZEIRO DO NORTE - CE, CEP 63040-602", "telefone": "(88) 9802-0916", "lat": -7.2136, "lng": -39.3153}, {"nome": "SANTISTA AR CONDICIONADO", "cidade": "JUAZEIRO DO NORTE", "estado": "CE", "endereco": "015, AVENIDA PADRE CÍCERO, N° 4635, BAIRRO SÃO JOSÉ, JUAZEIRO DO NORTE - CE, CEP 63024-015", "telefone": "(88) 9788-8258", "lat": -7.2136, "lng": -39.3153}, {"nome": "MAX FRIO", "cidade": "GURUPI", "estado": "TO", "endereco": "AVENIDA LENIVAL CORREIA FERREIRA, QUADRA 08 LOTE 13, Nº 120, BAIRRO ALTO DA BOA VISTA, GURUPI - TO, CEP 77425-350", "telefone": "(63) 8410-7060", "lat": -11.7297, "lng": -49.0647}, {"nome": "IRMÃO DO AR", "cidade": "SÃO CAETANO", "estado": "PE", "endereco": "RODOVIA BR 232 S/N KM 148, BAIRRO CENTRO, SÃO CAETANO - PE, CEP 55130-000", "telefone": "(81) 9247-4856", "lat": -8.3358, "lng": -36.2994}, {"nome": "WALLAS AR", "cidade": "SEABRA", "estado": "BA", "endereco": "2ª TRAVESSA FÉLIX LAUREANO PIRES, Nº 432, SEABRA - BA, CEP 46900-000", "telefone": "(75) 9865-0866", "lat": -12.4208, "lng": -41.77}, {"nome": "RAIR PORTO DE SOUZA", "cidade": "BARREIRAS", "estado": "BA", "endereco": "AVENIDA ALBERTO AMORIM, Nº 2258, BAIRRO SÃO PEDRO, BARREIRAS - BA, CEP 47810-820", "telefone": "(77) 9993-4328", "lat": -12.1522, "lng": -45.0}, {"nome": "HOT TAPE AR CONDICIONADO", "cidade": "VITÓRIA", "estado": "ES", "endereco": "RUA JOAQUIM LEOPOLDINO LOPES, Nº 55, BAIRRO CONSOLAÇÃO, VITÓRIA - ES, CEP 29045-580", "telefone": "(27) 98119-9000", "lat": -20.3155, "lng": -40.3128}, {"nome": "MORIAR", "cidade": "LONDRINA", "estado": "PR", "endereco": "PR-445, KM 83, BAIRRO PEROBINHA, LONDRINA - PR, CEP 86026-020", "telefone": "(43) 8492-1240", "lat": -23.3105, "lng": -51.1628}, {"nome": "AUTO CENTER E ELÉTRICA SALMO 23", "cidade": "CHAPADÃO DO CÉU", "estado": "GO", "endereco": "RUA FIGUEIRA LESTE, Nº 73, BAIRRO CENTRO, CHAPADÃO DO CÉU - GO, CEP 75828-000", "telefone": "(64) 9663-7408", "lat": -18.3928, "lng": -52.5281}, {"nome": "W&M AR CONDICIONADO", "cidade": "ITUMBIARA", "estado": "GO", "endereco": "AVENIDA AFONSO PENA, Nº 1540, BAIRRO AFONSO PENA, ITUMBIARA - GO, CEP 75516-130", "telefone": "(64) 9 9295-6194", "lat": -18.4189, "lng": -49.2158}, {"nome": "TRIANGULO SERVICOS E PECAS LTDA", "cidade": "UBERLÂNDIA", "estado": "MG", "endereco": "RUA ODORICO GLENILDA DE OLIVEIRA, Nº 10, BAIRRO DISTRITO INDUSTRIAL, UBERLÃNDIA - MG, CEP 38402-338", "telefone": "(34) 9190-1717", "lat": -18.9186, "lng": -48.2772}, {"nome": "SO AR", "cidade": "MANAUS", "estado": "AM", "endereco": "RUA PRESIDENTE RANIERI MAZILLI, Nº 27, BAIRRO PARQUE DEZ DE NOVEMBRO, MANAUS - AM, CEP 69058-291", "telefone": "(92) 9305-1881", "lat": -3.1019, "lng": -60.025}, {"nome": "RCS AR CONDICIONADO", "cidade": "ILHÉUS", "estado": "BA", "endereco": "AVENIDA ITABUNA, Nº 1303, BAIRRO CONQUISTA,ILHÉUS - BA, CEP 45653-160", "telefone": "(73) 9948-5408", "lat": -14.7939, "lng": -39.0328}, {"nome": "AUTO DIESEL PEREIRA LTDA", "cidade": "COROMANDEL", "estado": "MG", "endereco": "RUA ARTHUR BERNARDES, Nº 585, BAIRRO SÃO DOMINGOS, COROMANDEL - MG, CEP 38550-026", "telefone": "(34) 9107-8309", "lat": -18.4733, "lng": -47.2006}, {"nome": "AUTO ELETRICA DO RAFA", "cidade": "GUARDA-MOR", "estado": "MG", "endereco": "RUA MONTE CARMELO, Nº 449, BAIRRO JK, GUARDA-MOR - MG, CEP 38570-000", "telefone": "(38) 9892-1431", "lat": -17.7717, "lng": -47.0953}, {"nome": "VILLAGE AUTO SOM LTDA", "cidade": "GUANHÃES", "estado": "MG", "endereco": "AVENIDA GOVERNADOR MILTON CAMPOS, Nº 1274, BAIRRO CENTRO, GUALHÃES, MG, CEP 39740-000", "telefone": "(33) 8886-2845", "lat": -18.7778, "lng": -42.9469}, {"nome": "DENNER MAGNO MARCIANO DA SILVA", "cidade": "IGARATINGA", "estado": "MG", "endereco": "ROD BR 262 TREVO DE ANTUNES, SN, KM 417, BAIRRO ANTUNES, IGARATINGA - MG, CEP 35698-000", "telefone": "(37) 9858-9394", "lat": -19.9853, "lng": -44.6497}, {"nome": "EKIPCAR COMÉRCIO E SERVIÇOS", "cidade": "MANHUAÇU", "estado": "MG", "endereco": "AVENIDA AGENOR DE PAULA SALAZAR, N° 181, BAIRRO PONTE DA ALDEIA, MANHUAÇU - MG, CEP 36906-470", "telefone": "(33) 8899-7262", "lat": -20.2578, "lng": -42.0294}, {"nome": "CLIMA TECH", "cidade": "JUIZ DE FORA", "estado": "MG", "endereco": "RUA JOSÉ MICHERIFE, Nº 111, BAIRRO SÃO PEDRO, JUIZ DE FORA - MG, CEP 36025-550", "telefone": "(32) 9852-0317", "lat": -21.7642, "lng": -43.3503}, {"nome": "JC AR CONDICIONADO", "cidade": "CAPUTIRA", "estado": "MG", "endereco": "AVENIDA MANOEL FRANCISCO DE FREITAS, Nº 25, BAIRRO CENTRO, CAPUTIRA - MG, CEP 36925-000", "telefone": "(31) 9500-6031", "lat": -20.2244, "lng": -42.2928}, {"nome": "AUTO ELETRICA E AR CONDICIONADO POTENCIA LTDA", "cidade": "BURITIZEIRO", "estado": "MG", "endereco": "AVENIDA PERIMETRAL RODRIGUES ALVES BR-365 KM 168, Nº 705, BAIRRO QUINTAS DO AGRESTE, BURITIZEIRO, MG, CEP 39280-000", "telefone": "(38) 9755-9533", "lat": -17.3561, "lng": -44.9617}, {"nome": "ELETRONICA PX", "cidade": "MONTES CLAROS", "estado": "MG", "endereco": "RUA SEIS, Nº 1115, BAIRRO CHACARA CERES, MONTES CLAROS - MG, CEP 39406-345", "telefone": "(38) 9986-6268", "lat": -16.7286, "lng": -43.8617}, {"nome": "CLIMEC", "cidade": "GUARAPUAVA", "estado": "PR", "endereco": "RUA CANINDÉ, Nº 94, BAIRRO CONRADINHO, GUARAPUAVA - PR, CEP 85055-090", "telefone": "(42) 8829-1357", "lat": -25.39, "lng": -51.4575}, {"nome": "FERREIRA AR", "cidade": "PARNAMIRIM", "estado": "RN", "endereco": "AVENIDA DR. MARIO NEGOCIO, Nº 652, BAIRRO ROSA DOS VENTOS, PARNAMIRIM - RN, CEP 59141-560", "telefone": "(84) 8871-9993/84992166967", "lat": -5.9147, "lng": -35.2639}, {"nome": "43.254.244 ALISSON ZANUSO DALLA CHIESA", "cidade": "FAZENDA RIO GRANDE", "estado": "PR", "endereco": "AVENIDA DAS AMÉRICAS, Nº 3379, BAIRRO NAÇÕES, FAZENDA RIO GRANDE - PR, CEP 83824-020", "telefone": "(41) 9825-6160", "lat": -25.6619, "lng": -49.3036}, {"nome": "RAY AR", "cidade": "PORTO VELHO", "estado": "RO", "endereco": "RUA RAIMUNDO CANTUÁRIA, Nº 5489, BAIRRO AGENOR M. DE CARVALHO, PORTO VELHO - RO, CEP 76820-247", "telefone": "(69) 9301-9259", "lat": -8.7612, "lng": -63.9039}, {"nome": "REFRIGERAÇÃO GLACIAL", "cidade": "DRACENA", "estado": "SP", "endereco": "AVENIDA VITÓRIA, Nº 367, BAIRRO JARDIM EUROPA, DRACENA - SP, CEP 17900-000", "telefone": "(18) 9 9749-9039", "lat": -21.4833, "lng": -51.5328}, {"nome": "TATIELE DA SILVA FAVARIN / AGR MANUTENÇÕES", "cidade": "SALES OLIVEIRA", "estado": "SP", "endereco": "RUA JOSEPHINA G. S. TURIM, Nº 247, BAIRRO JARDIM AURORA I, SALES OLIVEIRA - SP, CEP 14660000", "telefone": "(16) 9 9223-2869", "lat": -20.7703, "lng": -47.8378}, {"nome": "CRF AR CONDICIONADO AGRICOLA", "cidade": "DIVINOLÂNDIA", "estado": "SP", "endereco": "AVENIDA PREFEITO OSVALDO LOPES, Nº 1208, BAIRRO CENTRO, DIVINÔLANDIA - SP, CEP 13780-000", "telefone": "(19) 9 8165-0123", "lat": -21.6619, "lng": -46.7358}, {"nome": "PEDRO GOMES TRATORES E IMPLEMENTOS - EPP", "cidade": "MACATUBA", "estado": "SP", "endereco": "AVENIDA BRASIL, N°R-74, ÁREA RURAL DE MACATUBA, MACATUBA-SP, CEP 17299-899", "telefone": "(14) 9 9898-5998", "lat": -22.5025, "lng": -48.7153}, {"nome": "IRMAOS FOLTRAN AR CONDICIONADO E MANUTENCOES", "cidade": "TIETÊ", "estado": "SP", "endereco": "RUA VILA NOVA, Nº 2267, BAIRRO SAO PEDRO, TIETE - SP, CEP 18530-000", "telefone": "(15) 9 9767-8027", "lat": -23.1058, "lng": -47.7178}, {"nome": "RD AR CONDICIONADO", "cidade": "SANTOS", "estado": "SP", "endereco": "AVENIDA VISCONDE DE SÃO LEOPOLDO, Nº 499, BAIRRO CENTRO, SANTOS - SP, CEP 11010-201", "telefone": "(13) 9 7415-8423", "lat": -23.9608, "lng": -46.3333}, {"nome": "CLIMA SOLAR TOP", "cidade": "CAMAÇARI", "estado": "BA", "endereco": "1° Travessa do Jasmim 16 Primeiro andar, Camaçari - BA, 42805-097", "telefone": "(71) 8746-3208", "lat": -12.6994, "lng": -38.3244}, {"nome": "TS ELETRIAR CENTRO AUTOMOTIVO", "cidade": "RIO BRANCO", "estado": "AC", "endereco": "Av. Amadeo Barbosa, 1992 - Areal, Rio Branco - AC, 69906-037", "telefone": "(68) 9231-0375", "lat": -9.9781, "lng": -67.8078}, {"nome": "TREIN DETALHAMENTO & ACESSORIOS LTDA", "cidade": "SÃO SEBASTIÃO DO CAI", "estado": "RS", "endereco": "RUA VEREADOR JOSE GOULARTH, N°55, BAIRRO NOVA RIO BRANCO, SÃO SEBASTIÃO DO CAI – RS CEP 95760-000", "telefone": "(51) 9995-3615", "lat": -29.5897, "lng": -51.3775}, {"nome": "2 IRMÃO REFRIGERAÇÃO LTDA", "cidade": "VALENÇA", "estado": "PI", "endereco": "BR 316, KM 210, BAIRRO VILA AEROPORTO, VALENÇA – PIAUÍ-PI CEP 64300000", "telefone": "(89) 8136-4197", "lat": -6.4042, "lng": -41.7378}, {"nome": "JB ACESSÓRIOS PARA VEÍCULOS LTDA,", "cidade": "TRÊS RIOS", "estado": "RJ", "endereco": "RODOVIA BR 393, KM 168, PONTA AZUL, TRÊS RIOS-RJ CEP 25821-145", "telefone": "(24) 9 9263-1475", "lat": -22.1183, "lng": -43.2086}, {"nome": "REI DA DUTRA LTDA", "cidade": "PINDAMONHANGABA", "estado": "SP", "endereco": "ESTRADA VICINAL CLARINDO AUGUSTO DOS SANTOS, N° 431, BAIRRO INDUSTRIAL MOREIRA CÉSAR, PINDAMONHANGABA-SP CEP 12442-250", "telefone": "(12) 9 9604-0690", "lat": -22.9236, "lng": -45.4611}, {"nome": "PATOS SERVIÇOS CLIMATIZAÇÃO LTDA", "cidade": "PATOS DE MINAS", "estado": "MG", "endereco": "AV. JOSÉ LOBO VASCPNCELOS, N°183, PLANALTO, PATOS DE MINAS-MG CEP 38.706-315", "telefone": "(34) 9145-0495", "lat": -18.5783, "lng": -46.5178}, {"nome": "DG AUTO ELÉTRICA LTDA", "cidade": "ITAMARANDIBA", "estado": "MG", "endereco": "RUA SÃO GERALDO, N° 604, BAIRRO SÃO GERALDO, ITAMARANDIBA-MG, CEP 39670-000", "telefone": "(38) 9892-8442", "lat": -17.855, "lng": -42.8564}, {"nome": "JEEP AR CONDICIONADO", "cidade": "TUPANDI", "estado": "RS", "endereco": "RUA DOS PLATANOS,Nº 415, TUPANDI - RS, CEP 95775-000", "telefone": "(51) 9306-6950", "lat": -29.5147, "lng": -51.4528}, {"nome": "SOLARIS MAIS ENERGIA SOLAR E SERVIÇOS ELETRICOS/ SERVIÇOS ELETRICOS", "cidade": "JOÃO PESSOA", "estado": "PB", "endereco": "AV. SÃO JUDAS TADEU, Nº 954, VARJÃO, JOÃO PESSOA - PARAÍBA- 58070100", "telefone": "(83) 9 9165-3839", "lat": -7.1195, "lng": -34.845}, {"nome": "UNION REFRIGERAÇÃO E AUTO PEÇAS", "cidade": "FORMIGA", "estado": "MG", "endereco": "AV. BRASIL 1110- MANGABEIRAS, FORMIGA- MG- 35570-000", "telefone": "(37) 9 9963-3107", "lat": -20.4647, "lng": -45.4261}, {"nome": "040 ACESSÓRIOS PARA VEÍCULOS LTDA", "cidade": "CONSELHEIRO LAFAIETE", "estado": "MG", "endereco": "BR 040 KM 623, Nº 22825, BAIRRO BARREIRA, CONSELHEIRO LAFAEITE - MG, CEP 36407-430", "telefone": "(31) 3761-3969/(31) 98718-8223", "lat": -20.6611, "lng": -43.7886}, {"nome": "ELETROCAR", "cidade": "SANTO ANTÔNIO DE PÁDUA", "estado": "RJ", "endereco": "ESTRADA PÁDUA IBITIGUAÇÚ S/N KM 03, BAIRRO DIVINÉIA, SANTO ANTÔNIO DE PÁDUA - RJ, CEP 28470-000", "telefone": "(22) 9 8147-6059/(22) 9 8109-7054", "lat": -21.5408, "lng": -42.1806}, {"nome": "MEIO KILO AR CONDICIONADO", "cidade": "MONTES CLAROS", "estado": "MG", "endereco": "RUA 8, nº 81, BAIRRO QUINTAS DA PRODUÇÃO, MONTES CLAROS - MG, CEP 39405-190", "telefone": "(38) 9 9951-1689/(38) 9 9964-7775", "lat": -16.7286, "lng": -43.8617}, {"nome": "ELITE CAR LANTERNAGEM E PEÇAS LTDA", "cidade": "ITAMARANDIBA", "estado": "MG", "endereco": "RUA SAO JOAO EVANGELISTA, Nº 1695, BAIRRO PRIMEIRO DE MAIO, ITAMARANDIBA - MG, CEP 39670-000", "telefone": "(38) 9 9135-1497", "lat": -17.855, "lng": -42.8564}, {"nome": "CENTRAL AR", "cidade": "DORMENTES", "estado": "PE", "endereco": "RODOVIA PE 635, LOTTO FRANCISCA IRENE, DORMENTES-PE- 56355000", "telefone": "(87) 9 9652-2396", "lat": -8.4417, "lng": -40.7769}, {"nome": "NETO AUTO ELÉTRICA", "cidade": "PARANAÍBA", "estado": "MS", "endereco": "RUA DAS ACÁCIAS, Nº 2931, PARANAIBA - MS, CEP 79500-000", "telefone": "(67) 9 8194-3559", "lat": -19.6778, "lng": -51.1908}, {"nome": "MG TACOGRAFO ELETRICA E ACESSORIOS LTDA", "cidade": "BETIM", "estado": "MG", "endereco": "RUA DAS INDUSTRIAS, Nº 100, BAIRRO DISTRITO INDUSTRIAL JARDIM PIEMONT NORTE, BETIM - MG, CEP 32689-374", "telefone": "(31) 9 8452-5815", "lat": -19.9678, "lng": -44.1983}, {"nome": "YURY ELETROELETRÔNICA", "cidade": "NANUQUE", "estado": "MG", "endereco": "RUA TARDIE FERRAZ DE OLIVEIRA, Nº 335, BAIRRO NOVO HORIZONTE, NANUQUE - MG, CEP 39860-000", "telefone": "(33) 9110-8741", "lat": -17.8453, "lng": -40.3531}, {"nome": "PROAR", "cidade": "COLINAS DO TOCANTINS", "estado": "TO", "endereco": "AVENIDA PEDRO LUDOVICO TEIXEIRA, Nº 514, BAIRRO CENTRO, COLINA DO TOCANTINS - TO, CEP 77760-000", "telefone": "(63) 3476-1330/(63) 98472-4088", "lat": -8.0597, "lng": -48.4761}, {"nome": "ARTECHCONGONHAS", "cidade": "CONGONHAS", "estado": "MG", "endereco": "RUA JOSÉ HÉLIO DE MIRANDA, Nº 251, BAIRRO RECANTO DAS ANDORINHAS, CONGONHAS - MG, CEP 36414-198", "telefone": "(31) 98776-3524", "lat": -20.5006, "lng": -43.8586}, {"nome": "ELIVELTON SALES FERREIRA BUENOS", "cidade": "ÁGUA BOA", "estado": "MG", "endereco": "RUA BOM JESUS, Nº 288, BAIRRO CENTRO, AGUÁ BOA - MG, CEP 39790-000", "telefone": "(33) 9 9838-7884", "lat": -18.5453, "lng": -52.1525}, {"nome": "AGRO MULTISERVICE - AUTO ELETRICA E AR CONDICIONADO", "cidade": "REDENÇÃO", "estado": "PA", "endereco": "AVENIDA ARAGUAIA, BOX 07, S/N ANEXO POSTO PARAZÃO, BAIRRO ADEMAR GUIMARAES, REDENÇÃO - PA, CEP 68552-412", "telefone": "(94) 9 8430-9485", "lat": -8.0317, "lng": -49.9775}, {"nome": "REFRI MAIS- ADILSON SILVA DOS SANTOS", "cidade": "JAÚ", "estado": "SP", "endereco": "AVENIDA JOAQUIM FERRAZ DE ALMEIDA PRADO, Nº 1670, BAIRRO JARDIM OLIMPIA, JAÚ - SP, CEP 17208-270", "telefone": "(14) 9 9608-5542", "lat": -22.2953, "lng": -48.5583}, {"nome": "LEO AR CONDICIONADO LTDA", "cidade": "ARACRUZ", "estado": "ES", "endereco": "RUA DAS ARARAS, Nº 57, BAIRRO PLANALTO, ARACRUZ - ES, CEP 291908-000", "telefone": "(27) 9 9878-4095", "lat": -19.8194, "lng": -40.2744}, {"nome": "PROTHEC REFRIGERAÇÃO", "cidade": "GRAVATAL", "estado": "SC", "endereco": "AVENIDA DA PAZ, Nº 3A, BAIRRO TERMAS DO GRAVATAL - SC, CEP 88735-000", "telefone": "(48) 9907-1175", "lat": -28.3278, "lng": -49.0544}, {"nome": "VEÍCULO MARCADO LTDA - APACHE", "cidade": "CONTAGEM", "estado": "MG", "endereco": "RUA D, N°45, BAIRRO VERA CRUZ, CONTAGEM MG, CEP 32260-630", "telefone": "(31) 2586-5070/(31) 99401-3878", "lat": -19.9317, "lng": -44.0536}, {"nome": "A B N AUTO ELETRICA LTDA", "cidade": "TEÓFILO OTONI", "estado": "MG", "endereco": "AVENIDA ALFREDO SÁ, Nº 6010, BAIRRO VILA RAMOS, SÃO CRISTOVÃO - MG, CEP 39800307", "telefone": "(33) 8801-8411", "lat": -17.8578, "lng": -41.5053}, {"nome": "VELTA TACOGRAFO SERVIÇOS PEÇAS E ACESSORIOS PARA VEICULO LTDA", "cidade": "SIMÕES FILHO", "estado": "BA", "endereco": "AVENIDA DOS EUCALIPTOS, Nº 298, BAIRRO RECANTOS DOS EUCALIPTOS, SIMOES FILHOS - BA, CEP 43700-202", "telefone": "(71) 8763-5111/(71) 9623-3145", "lat": -12.7883, "lng": -38.4011}, {"nome": "SERVICE ICE REFRIGERAÇÃO VEICULAR", "cidade": "GUARULHOS", "estado": "SP", "endereco": "RUA ITAQUARA 539, BAIRRO JARDIM PRESIDENTE DUTRA, GUARULHOS SP, CEP 07172-170", "telefone": "(11)9 9276-0153/(11)9 4010-7479", "lat": -23.4644, "lng": -46.5333}, {"nome": "PATRICK NEBEL DE QUADRO", "cidade": "CAPÃO DO LEÃO", "estado": "RS", "endereco": "BR 116, Nº 2384, BAIRRO JARDIM AMERICA, CAPÃO DO LEÃO - RS, CEP 96160-000", "telefone": "(53) 8158-7271", "lat": -31.7622, "lng": -52.4733}, {"nome": "OTAVIO FURTADO MEDEIROS", "cidade": "BICAS", "estado": "MG", "endereco": "RUA ARTHUR BERNARDES, Nº 630, GALPÃO, BAIRRO CENTRO, BICAS - MG, CEP 36600-022", "telefone": "(32) 9938-9524", "lat": -21.7233, "lng": -43.0619}, {"nome": "ZETEQUE REFRIGERAÇÃO LTDA", "cidade": "BOM JESUS DO NORTE", "estado": "ES", "endereco": "AVENIDA CRISTIANO DIAS LOPES, Nº 198, BAIRRO SILVANA, BOM JESUS DO NORTE - ES, CEP 29004-600", "telefone": "(22) 9 9981-5925", "lat": -21.1261, "lng": -41.6706}, {"nome": "IVAN PINHEIRO SERVICOS", "cidade": "CAMPINAS", "estado": "SP", "endereco": "RUA JOÃO CARLOS DO AMARAL, Nº 388, BAIRRO JARDIM APARECIDA , CAMPINAS - SP, CEP 13068-617", "telefone": "(17) 9 9662-4015", "lat": -22.9056, "lng": -47.0608}, {"nome": "JAIRO GOMES DE LIRA LIMA", "cidade": "PRESIDENTE PRUDENTE", "estado": "SP", "endereco": "RUA JOSE STABILE - 422, BAIRRO JARDIM ITAPURA, PRESIDENTE PRUDENTE - SP, CEP 19042-240", "telefone": "(18) 9 9721-2128", "lat": -22.1256, "lng": -51.3889}, {"nome": "ANDRADE E SOUZA AR CON E ACES. P/ VE LTD", "cidade": "UBERLÂNDIA", "estado": "MG", "endereco": "JOSE ANDRAUS GASSANI, Nº 400, BAIRRO MINAS GERAIS, UBERLANDIA - MG, CEP 38402-322", "telefone": "(34) 9129-8062/ (34) 9198-2327", "lat": -18.9186, "lng": -48.2772}, {"nome": "ARCOFRAN COMERCIAL LTDA", "cidade": "FRANCA", "estado": "SP", "endereco": "AVENIDA JAIME TELLINI, Nº 3880, BAIRRO BELVEDERE BANDEIRANTE, FRANCA - SP, CEP 14403-785", "telefone": "(16) 99174-6070/(16) 99107-7000", "lat": -20.5394, "lng": -47.4008}, {"nome": "ALESSANDRA VITORIA GAJDECZKA LTDA", "cidade": "PORTO UNIÃO", "estado": "SC", "endereco": "RUA ANDRÉ LUBI, Nº 76, BAIRRO SÃO PEDRO, PORTO UNIAO - SC, CEP 89400-000", "telefone": "(42) 8866-0079", "lat": -26.235, "lng": -51.0797}, {"nome": "AUTO ELETRICA FREDAO", "cidade": "UBERABA", "estado": "MG", "endereco": "AVENIDA CORONEL JOAQUIM DE OLIVEIRA, Nº 1677, BAIRRO PARQUE SÃO GERALDO, UBERABA - MG, CEP 38031-000", "telefone": "(34) 99797-9606/(34) 99652-5491", "lat": -19.7478, "lng": -47.9317}, {"nome": "ALEXSANDRO CAMPOS DA SILVA 11058991604", "cidade": "PERDIZES", "estado": "MG", "endereco": "RUA CALIMERIO AFONSO NUNES, Nº 41, BAIRRO JARDIM ESPERANÇA, PERDIZES - MG, CEP 38170-000", "telefone": "(34) 9 9190-7047", "lat": -19.3472, "lng": -47.295}, {"nome": "J.S ALENCAR LTDA", "cidade": "BELÉM", "estado": "PA", "endereco": "AVENIDA MARQUES DE HERVAL, Nº 1392, BAIRRO PEDREIRA, BELÉM - PA, CEP 66085-316", "telefone": "(91) 8179-1853", "lat": -1.4558, "lng": -48.5044}, {"nome": "CLIMA CAR", "cidade": "ALTAMIRA", "estado": "PA", "endereco": "RUA 7 DE SETEMBRO S/N, BAIRRO CENTRO, ALTAMIRA - PA, CEP 68371-000", "telefone": "(93) 9146-8918", "lat": -3.2039, "lng": -52.2064}, {"nome": "ATUAR CLIMATIZACAO", "cidade": "VILA BELA DA SANTÍSSIMA TRINDADE", "estado": "MT", "endereco": "RUA MARTIMIANO RIBEIRO DA FONSECA S/N, BAIRRO JARDIM AEROPORTO, VILA BELA DA SANTISSIMA TRINDADE - MT, CEP 78245-000", "telefone": "(65) 8133-6656", "lat": -14.9964, "lng": -59.9472}, {"nome": "JUNIOR AR CONDICIONADO COMERCIO E SERVICOS LTDA", "cidade": "ALTAMIRA", "estado": "PA", "endereco": "AVENIDA JADER BARBALHO, Nº 4100, EM FRENTE A AUTO COR, BAIRRO BELA VISTA, ALTAMIRA - PA, CEP 68374-709", "telefone": "(93) 9108-7134", "lat": -3.2039, "lng": -52.2064}, {"nome": "FRANCK AURELIO FERREIRA ME", "cidade": "PATOS DE MINAS", "estado": "MG", "endereco": "RUA ARI PESSOA FRANCO, Nº 517, BAIRRO CIDADE NOVA, PATOS DE MINAS - MG, CEP 38706-416", "telefone": "(34) 9909-2025", "lat": -18.5783, "lng": -46.5178}, {"nome": "I.LIMA NUNES PIMENTEL", "cidade": "SINOP", "estado": "MT", "endereco": "RUA DIRSON JOSE MARTINI, Nº 125, BAIRRO DISTRITO INDUSTRIAL, SINOP - MT, CEP 78557-524", "telefone": "(66) 9932-4312/(65) 9985-2255", "lat": -11.865, "lng": -55.505}, {"nome": "55.407.906 CARLOS AUGUSTO GONCALVES", "cidade": "PIRACICABA", "estado": "SP", "endereco": "RUA JOÃO ZEM, Nº 1051, BAIRRO JARDIM SÃO LUIS, PIRACICABA - SP, CEP 13408-196", "telefone": "(19) 9 9248-2376", "lat": -22.7253, "lng": -47.6492}, {"nome": "OFICINA DO BAIANO FREIOS", "cidade": "PATOS DE MINAS", "estado": "MG", "endereco": "AVENIDA JOSE SOARES MACHADO, Nº 297, BAIRRO PLANALTO, PATOS DE MINAS - MG, CEP 38706-303", "telefone": "(34) 9 9221-0110", "lat": -18.5783, "lng": -46.5178}, {"nome": "CONSULTER TI LTDA", "cidade": "BURITIS", "estado": "MG", "endereco": "AVENIDA BANDEIRANTES, Nº 1182, BAIRRO CANAÃ, BURITIS - MG, CEP 38660-000", "telefone": "(38) 9942-5249", "lat": -15.6183, "lng": -46.4236}, {"nome": "MOTORCLIMA AR CONDICIONADO ELETRICA E REFRIGERAÇÃO LTDA ME", "cidade": "PIRACICABA", "estado": "SP", "endereco": "AVENIDA COMENDADOR LUCIANO GUIDOTTI, Nº 2940, BAIRRO JARDIM CAXAMBU, PIRACICABA - SP, CEP 13425-000", "telefone": "(19) 9 9797-2245", "lat": -22.7253, "lng": -47.6492}, {"nome": "JONATHAN ROGER S. DE OLIVEIRA / MAIA AR CONDICIONADO AUTOMOTIVO", "cidade": "VILHENA", "estado": "RO", "endereco": "RUA VIVIANE PEREIRA DE MORAES, Nº 5947, BAIRRO INDUSTRIAL TANCREDO NEVES, VILHENA - RO, CEP 76988-002", "telefone": "(69) 8410-6486", "lat": -12.7408, "lng": -60.1458}, {"nome": "JONEANDERSON DE ALMEIDA SOUZA", "cidade": "BOA VISTA", "estado": "RR", "endereco": "RUA ITAJARA, Nº 156, BAIRRO CENTENARIO, BOA VISTA - RR, CEP 69313-022", "telefone": "(95) 9128-5223", "lat": 2.8197, "lng": -60.6733}, {"nome": "52.813.001 FABIO LIMA DOS SANTOS", "cidade": "AÇAILÂNDIA", "estado": "MA", "endereco": "RUA R.A UM, Nº 15, BAIRRO JARDIM DE ALAH, AÇAILÂNDIA - MA 65930-000", "telefone": "(99) 9187-4399", "lat": -4.9478, "lng": -47.5003}, {"nome": "GRINKAR LTDA", "cidade": "PORTO ALEGRE", "estado": "RS", "endereco": "AVENIDA ASSIS BRASIL, Nº 8620, LOJA 01A, BAIRRO SARANDI, PORTO ALEGRE - RS, CEP 91140-000", "telefone": "(51) 9649-1072 (51) 2400-0444", "lat": -30.0331, "lng": -51.23}, {"nome": "J & K COMERCIO SERVIÇOS E CONSULTORIA LTDA", "cidade": "ESTÂNCIA", "estado": "SE", "endereco": "AVENIDA JOÃO LIMA DA SILVEIRA, Nº 2936, BAIRRO ALAGOAS, ESTÂNCIA - SE, CEP 49200-000", "telefone": "(79) 9975-3756", "lat": -11.2664, "lng": -37.4383}, {"nome": "JEFERSON RIBEIRO DE SOUZA", "cidade": "SENHOR DO BONFIM", "estado": "BA", "endereco": "AVENIDA JOÃO DURVAL CARNEIRO, Nº 479, BAIRRO BOSQUE, SENHOR DO BONFIM - BA, CEP 48970-000", "telefone": "(74) 9143-5128", "lat": -10.4611, "lng": -40.1878}, {"nome": "IAGO SANTOS CARDOSO", "cidade": "VITÓRIA DA CONQUISTA", "estado": "BA", "endereco": "RUA JOAQUIM FROES, Nº 237, BAIRRO ALTO MARON, VITORIA DA CONQUISTA - BA, CEP 45005-024", "telefone": "(77) 8882-4338", "lat": -14.8661, "lng": -40.8444}, {"nome": "SPACE CAR AR CONDICIONADO AUTOMOTIVO LTDA", "cidade": "NOVO PROGRESSO", "estado": "PA", "endereco": "AVENIDA ORIVAL PRAZERES, Nº 2317, BAIRRO VISTA ALEGRE, NOVO PROGRESSO - PA, CEP 68193-000", "telefone": "(93) 8421-3099 (93) 8405-3376", "lat": -7.1494, "lng": -55.3775}, {"nome": "ZERO GRAU COMERCIO DE PECAS PARA VEICULOS EIRELI", "cidade": "GUANAMBI", "estado": "BA", "endereco": "RUA AYRTON SENNA DA SILVA, Nº 76, BAIRRO SÃO FRANCISCO, GUANAMBI - BA, CEP 46430-000", "telefone": "(77) 3451-3652 (77) 9966-1778", "lat": -14.2228, "lng": -42.7808}, {"nome": "JMV CONSTRUÇÃO E SERVIÇO", "cidade": "MOJU", "estado": "PA", "endereco": "AVENIDA DAS PAMEIRAS, Nº 350, BAIRRO CENTRO, MOJU - PA, CEP 68450-000", "telefone": "(91) 9203-2495", "lat": -1.8839, "lng": -48.765}, {"nome": "SA REFRIGERAÇÃO AUTOMOTIVA", "cidade": "ANANINDEUA", "estado": "PA", "endereco": "TV. WE SESSENTA E OITO, 135, BAIRRO COQUEIRO, ANANINDEUA - PA, CEP 67143-440 - DE FRENTE COM O GOIANO TECIDOS", "telefone": "(91) 83753599", "lat": -1.3656, "lng": -48.3722}, {"nome": "A N B FEITOSA", "cidade": "IGUATU", "estado": "CE", "endereco": "AVENIDA CARLOS ROBERTO COSTA, Nº 555, BAIRRO AREIAS I, IGUATU - CE, CEP 63508-087", "telefone": "(88) 8803-0303", "lat": -6.3594, "lng": -39.2989}, {"nome": "ZERO GRAU REFRIGERAÇÃO E AR CONDICIONADO", "cidade": "TAIOBEIRAS", "estado": "MG", "endereco": "RUA GUARANIS, Nº 70, BAIRRO NOSSA SENHORA DE FATIMA, TAIOBEIRAS - MG, CEP 39550-000", "telefone": "(38) 9970-1413", "lat": -15.8083, "lng": -42.2303}, {"nome": "SHALOM AUTO ELETRICA E ACESSORIOS LTDA", "cidade": "JANAÚBA", "estado": "MG", "endereco": "RUA AFONSO PENA, Nº 1521, BAIRRO SANTO ANTÔNIO, JANAUBA - MG, CEP 39447-000", "telefone": "(38) 9180-5800", "lat": -15.8022, "lng": -43.3078}, {"nome": "LUCAS AFONSO BARROS ANDRADE", "cidade": "PETROLINA", "estado": "PE", "endereco": "AVENIDA DA REDENÇÃO, Nº 711, BAIRRO ANTÔNIO CASSIMIRO, PETROLINA - PE, CEP 56321-440", "telefone": "(87) 8861-0798", "lat": -9.3989, "lng": -40.4997}, {"nome": "MATEUS TIMÓTEO ROSA CARDOSO", "cidade": "BOCAIUVA", "estado": "MG", "endereco": "RUA CANUTO FERREIRA DA SILVA, Nº 524, BAIRRO NOSSA SENHORA APARECIDA, BOCAIUVA - MG, CEP 39390-000", "telefone": "(38) 9742-0931", "lat": -17.1083, "lng": -43.8183}, {"nome": "WL CLIMATIZAÇÃO AUTOMOTIVA", "cidade": "PARAUAPEBAS", "estado": "PA", "endereco": "RUA F20, QUADRA 154 LOTE 09, BAIRRO CIDADE JARDIM, PARAUAPEBAS - PA, CEP 68515-000", "telefone": "(94) 8131-7681", "lat": -6.0686, "lng": -49.9019}, {"nome": "GILVAN FELBERG REFRIGERAÇAO AUTOMOTIVA", "cidade": "ESPIGÃO DʼOESTE", "estado": "RO", "endereco": "RUA GOIAS, Nº 2953, BAIRRO LIBERDADE, ESPIGÃO DʼOESTE - RO, CEP 76974-000", "telefone": "(69) 8492-2822", "lat": -11.5236, "lng": -61.0097}, {"nome": "53.882.088 DIEGO LEONARDO MACHADO", "cidade": "EUGÊNOPOLIS", "estado": "MG", "endereco": "RUA MARANHÃO, Nº 04, BAIRRO PRIMAVERA, EUGENOPOLIS - MG, CEP 36855-000", "telefone": "(32) 9912-8097", "lat": -20.7189, "lng": -42.0453}, {"nome": "CLEITON ALVES SANTOS", "cidade": "RUBIM", "estado": "MG", "endereco": "RUA PERNAMBUCO, Nº 19, BAIRRO IPÊ, RUBIM - MG, CEP 39950-000", "telefone": "(33) 9862-5388", "lat": -16.3667, "lng": -40.5458}, {"nome": "GESSICA COSTA RIBEIRO", "cidade": "LUCAS DO RIO VERDE", "estado": "MT", "endereco": "RUA TAPURAH, Nº 2742, BAIRRO VENEZA, LUCAS DO RIO VERDE, CEP 78466-124", "telefone": "(65) 9229-5010", "lat": -13.0567, "lng": -55.9089}, {"nome": "60.288.625 KELVIN COSTA SILVA", "cidade": "PONTES E LACERDA", "estado": "MT", "endereco": "RUA BENEDITO FRANCISCO DA SILVA, Nº 2045, BAIRRO SÃO JOSÉ, PONTES E LACERDA - MT, CEP 78250-000", "telefone": "(65) 9801-9938 / (65) 9665-2838", "lat": -15.2264, "lng": -59.3361}, {"nome": "FORTLINK RASTREAMENTO VEICULAR", "cidade": "CACHOEIRO DE ITAPEMIRIM", "estado": "ES", "endereco": "AVENIDA ETELVINA VIVACQUA, Nº 112, BAIRRO NOVA BRASILIA, CACHOEIRO DE ITAPEMIRIM, CEP 29302-490", "telefone": "(27) 9 9787- 7090", "lat": -20.8489, "lng": -41.1128}, {"nome": "ELISIER ANTONIO BONATTO RAKOVSKI 83187936091", "cidade": "IJUÍ", "estado": "RS", "endereco": "BR 285 S/N, BAIRRO INTERIOR, IJUI - RS, CEP 98700-000", "telefone": "(55) 9659-0368", "lat": -28.3878, "lng": -53.9147}, {"nome": "BOX23 CLIMATIZAÇÃO AUTOMOTIVA LTDA", "cidade": "OLIVEIRA", "estado": "MG", "endereco": "AVENIDA RIO SÃO FRANCISCO, Nº 639, BAIRRO CONDOMÍNIO IMPERIAL, OLIVEIRA - MG, CEP 35540-000", "telefone": "(37) 9105-2158", "lat": -20.6969, "lng": -44.8267}, {"nome": "BRUNA DOS SANTOS 03950826505", "cidade": "ARACAJU", "estado": "SE", "endereco": "AVENIDA SANTA GLEIDE, Nº 424, BAIRRO OLARIA, ARACAJU - SE, CEP 49092-125", "telefone": "(79) 9672-6860", "lat": -10.9472, "lng": -37.0731}, {"nome": "35.977.576. EDER SANTOS DA SILVA", "cidade": "SÃO MIGUEL DO GUAPORÉ", "estado": "RO", "endereco": "AVENIDA GOVERNADOR JORGE TEIXEIRA, Nº 100, BAIRRO CENTRO, SÃO MIGUEL DO GUAPORÉ - RO, CEP 76932-000", "telefone": "(69) 9904-1057", "lat": -11.6897, "lng": -62.715}, {"nome": "36.965.223 JULIANO JOVINO", "cidade": "VITÓRIA DA CONQUISTA", "estado": "BA", "endereco": "AV. PRESIDENTE DUTRA, Nº 3133, BAIRRO CENTRO, VITORIA DA CONQUISTA - BA, CEP 45055-010 - AO LADO DA AVENIDA MANGABEIRA", "telefone": "(77) 8102-1463", "lat": -14.8661, "lng": -40.8444}, {"nome": "FRIO MÁXIMO COMÉRCIO DE PEÇAS E SERVIÇOS LTDA.", "cidade": "MACEIÓ", "estado": "AL", "endereco": "RUA BARÃO DE ATALAIA , Nº 493, BAIRRO CENTRO, MACEIO - AL, CEP 57020-510", "telefone": "(82) 3223-2094", "lat": -9.6658, "lng": -35.7353}, {"nome": "AGUIAR AR CONDICIONADO AUTOMOTIVO LTDA", "cidade": "TUCUMÃ", "estado": "PA", "endereco": "AVENIDA JASMIM DOS SERRADOS, S/N, BAIRRO PARAUDE, TUCUMÃ - PA, CEP 68385-000", "telefone": "(94) 9180-8533", "lat": -6.7447, "lng": -51.1539}, {"nome": "GIGATECH PROJETOS E INSTALAÇÕES", "cidade": "NATAL", "estado": "RN", "endereco": "RUA BÉTULA, Nº 7909, BAIRRO CIDADE SATÉLITE, NATAL - RN, CEP 59068-470", "telefone": "(84) 9655-7490", "lat": -5.7945, "lng": -35.211}, {"nome": "ACESSORIOS E AUTO ELETRICA ITAMARATY LTDA", "cidade": "IGARATINGA", "estado": "MG", "endereco": "RODOVIA BR 262, KM 413, S/N, BAIRRO ZONA RURAL, BAIRRO ANTUNES, IGARATINGA - MG, CEP 35698-000", "telefone": "(37) 9996-9999", "lat": -19.9853, "lng": -44.6497}, {"nome": "FV BOAS ME", "cidade": "CONFRESA", "estado": "MT", "endereco": "RUA INDUSTRIAL, Nº 75, BAIRRO VILAS NOVA, CONFRESA - MT, CEP 78652-000", "telefone": "(66) 8431-3337", "lat": -10.6417, "lng": -51.5636}, {"nome": "TREVO AR REFRIGERAÇÃO AUTOMOTIVO LTDA", "cidade": "RIO DAS OSTRAS", "estado": "RJ", "endereco": "ALAMEDA CAMPOMAR, S/N, LOTE 4 QUADRA 20, BAIRRO JARDIM CAMPOMAR, RIO DAS OSTRAS - RJ, CEP 28890-281", "telefone": "(22) 9 9721-4271", "lat": -22.5267, "lng": -41.9461}, {"nome": "MEGA AR LTDA", "cidade": "CONSELHEIRO LAFAIETE", "estado": "MG", "endereco": "ROD BR 040, Nº 23448, BAIRRO BARREIRA, CONSELHEIRO LAFAIETE, CEP 36407430", "telefone": "(31) 9734-8224", "lat": -20.6611, "lng": -43.7886}, {"nome": "MATEUS JOSÉ BARBOSA", "cidade": "ABAETÉ", "estado": "MG", "endereco": "RUA ANTÔNIO ROMUALDO, Nº 62, BAIRRO RENASCENÇA, ABAETÉ - MG, CEP 35620-000", "telefone": "(37) 9998-7919", "lat": -19.155, "lng": -45.4469}, {"nome": "ORIGINAL AUTO AR LTDA", "cidade": "CARAZINHO", "estado": "RS", "endereco": "AV. FLORES DA CUNHA, Nº 4467, BAIRRO BORGUETTI, CARAZINHO - RS, CEP 99500-000", "telefone": "(54) 3329-6549", "lat": -28.2839, "lng": -52.7889}, {"nome": "M.B AUTO ELETRICA LTDA / WALLTEC AUTO CENTER", "cidade": "CONCEIÇÃO DAS ALAGOAS", "estado": "MG", "endereco": "AV. BRASIL, Nº 1606, BAIRRO CENTRO, CONCEIÇÃO DAS ALAGOAS - MG, CEP 38120-000", "telefone": "(34) 9984-4645", "lat": -19.9178, "lng": -47.9878}, {"nome": "HEBERT MARTINS DE OLIVEIRA", "cidade": "CAMPO BELO", "estado": "MG", "endereco": "RUA OZANI BRAZ DE FARIA, Nº 425, BAIRRO VALE DO SOL, CAMPO BELO - MG, CEP 37270-000", "telefone": "(35) 9925-5409", "lat": -20.8978, "lng": -45.2733}, {"nome": "EDISON BARACIOLI", "cidade": "VOTUPORANGA", "estado": "SP", "endereco": "RODOVIA EUCLIDES DA CUNHA S/N, KM 507, BAIRRO ZONA RURAL, VOTUPORANGA-SP, CEP 15500-970", "telefone": "(17) 9 8143-5014", "lat": -20.4225, "lng": -49.9742}, {"nome": "BRENO UCKER JUNIOR", "cidade": "PELOTAS", "estado": "RS", "endereco": "RUA ANTÔNIO CURY, Nº 113, BAIRRO CENTRO, PELOTAS - RS, CEP 96020-390", "telefone": "(53) 9924-2377", "lat": -31.7654, "lng": -52.3376}, {"nome": "CLEYTON LINO GRANATO", "cidade": "ERVÁLIA", "estado": "MG", "endereco": "RUA SANTO ANTÔNIO, Nº 207 APTO 101, BAIRRO CENTRO, ERVÁLIA - MG, CEP 36555-009", "telefone": "(32) 9907-3500", "lat": -20.8475, "lng": -42.6589}, {"nome": "MAXX AUTO AR E ELETRICA LTDA", "cidade": "CARAZINHO", "estado": "RS", "endereco": "RUA HUMBERTO CAMPOS, Nº 551, BAIRRO PRINCESA, CARAZINHO - RS, CEP 99500-000", "telefone": "(54) 9979-7632", "lat": -28.2839, "lng": -52.7889}, {"nome": "GABRIEL COSTA OLIVEIRA", "cidade": "MINEIROS", "estado": "GO", "endereco": "RODOVIA BR 364, KM 310,5, S/N, BAIRRO ZONA RURAL, MINEIROS - GO, CEP 75830-000", "telefone": "(64) 9965-8940", "lat": -17.5694, "lng": -52.5558}, {"nome": "GIGANTE AR CONDICIONADO LTDA", "cidade": "HIDROLÂNDIA", "estado": "GO", "endereco": "AVENIDA D'JON, S/N, QUADRA 01 LOTE 13, AO LADO DA BR 153, BAIRRO JARDIM PARIS, HIDROLÂNDIA - GO, CEP 75340-000", "telefone": "(62) 8174-5652", "lat": -16.96, "lng": -49.2289}, {"nome": "TIGRÃO TRUCK CENTER", "cidade": "JUNQUEIRÓPOLIS", "estado": "SP", "endereco": "RUA PROF. MARIA EUGÊNIA REGAZOLLI, Nº 316, BAIRRO CAMPO BELLO, JUNQUEIRÓPOLIS - SP, CEP 17897-176", "telefone": "(18) 9 9614-6833", "lat": -21.5125, "lng": -51.4333}, {"nome": "REFRIRAR BAHIA LTDA", "cidade": "BOTUPORÃ", "estado": "BA", "endereco": "AVENIDA DOUTOR AURELIO ROCHA, Nº05, BAIRRO CENTRO, BOTUPORÃ - BA, CEP 46570-011", "telefone": "(77) 9113-2969", "lat": -13.1794, "lng": -42.5164}, {"nome": "GAUCHO COMERCIO E MANUTENCAO DE ACESSORIOS PARA VEICULOS LTDA", "cidade": "TOLEDO", "estado": "PR", "endereco": "RUA GUERINO MASCHIO, Nº 531, BAIRRO JARDIM CONCORDIA, TOLEDO - PR, CEP 85906-610", "telefone": "(79) 9946-7566", "lat": -24.7253, "lng": -53.7428}, {"nome": "LEONARDO CARNEIRO LEAO", "cidade": "CAMPINA VERDE", "estado": "MG", "endereco": "RUA 24, Nº 697, BAIRRO CENTRO, CAMPINA VERDE - MG, CEP 38270-000", "telefone": "(34) 9968-8396", "lat": -19.5344, "lng": -49.4858}, {"nome": "JJ TRUCK REPAIR LTDA", "cidade": "UBERLÂNDIA", "estado": "MG", "endereco": "5290 - BR-365, 5182 - zona rural, Uberlândia - MG, 38415-272", "telefone": "(34) 9256-8862", "lat": -18.9186, "lng": -48.2772}, {"nome": "LUCARELLI ELÉTRICA E ACESSORIO LTDA", "cidade": "RODEIRO", "estado": "MG", "endereco": "RODOVIA PREFEITO ADOLFO NICOLATO, Nº 283, BAIRRO INDUSTRIAL, RODEIRO - MG, CEP 36510-000", "telefone": "(32) 9939-3046", "lat": -21.1989, "lng": -42.8611}, {"nome": "BERNARDO RAPHAEL ARAUJO RAMOS", "cidade": "MONTES CLAROS", "estado": "MG", "endereco": "RUA LAGO GURUPIRA, Nº 112, BAIRRO INTERLAGOS, MONTES CLAROS - MG, CEP 39404-258", "telefone": "(38) 9950-8407", "lat": -16.7286, "lng": -43.8617}, {"nome": "F. DE SOUSA CURSOS E SERVIÇOS", "cidade": "SÃO LUÍS", "estado": "MA", "endereco": "RUA BOM JARDIM,( RES. MAGNÓLIA), Nº 2000, BAIRRO NOVA REPUBLICA, SÃO LUIS - MA, CEP 65090-478", "telefone": "(98) 9965-7003", "lat": -2.5364, "lng": -44.3056}, {"nome": "JOSÉ PEDRO DE MOURA", "cidade": "SERRA DO MEL", "estado": "RN", "endereco": "AVENIDA GRACILIANO FERREIRA DOS SANTOS, Nº 75, BAIRRO VILA BRASILIA, SERRA DO MEL - RN, CEP 59663-000", "telefone": "(88) 9916-8893", "lat": -5.2608, "lng": -37.6058}, {"nome": "WALDNEY COELHO DA SILVA ME", "cidade": "BARBACENA", "estado": "MG", "endereco": "RUA SÃO FRANCISCO, Nº 33, BAIRRO CAIÇARAS, BARBACENA - MG, CEP 36205-382", "telefone": "(32) 8835-8141", "lat": -21.2258, "lng": -43.7742}, {"nome": "AUTO ELÉTRICO E ACESSÓRIOS CACIQUE LTDA ME", "cidade": "ARAÇATUBA", "estado": "SP", "endereco": "RODOVIA MARECHAL KM 527, S/N, BAIRRO CAMPUS UNIVERSITARIO, ARAÇATUBA - SP, CEP 16018-805", "telefone": "(18) 99796-7888", "lat": -21.2089, "lng": -50.4328}, {"nome": "TRES PODERES ACESSORIOS LTDA", "cidade": "SETE LAGOAS", "estado": "MG", "endereco": "BR ZERO QUARENTA KM 471, S/N, BAIRRO ELDORADO, SETE LAGOAS - MG, CEP 35701-482", "telefone": "(31) 9774-3481", "lat": -19.4658, "lng": -44.2472}, {"nome": "ALINE OUTEIRO DA SILVA", "cidade": "TEUTÔNIA", "estado": "RS", "endereco": "RUA ARTHUR PILZ, Nº 565, BAIRRO LANGUIRU, TEUTONIA - RS, CEP 95890-000", "telefone": "(51) 9540-6056", "lat": -29.4447, "lng": -51.8011}, {"nome": "THERMO AR LTDA", "cidade": "CUIABÁ", "estado": "MT", "endereco": "AVENIDA FERNANDO CORREA DA COSTA, S/N, BAIRRO DISTRITO INDUSTRIAL, CUIABÁ - MT, CEP 78098-282", "telefone": "(65) 8437-0004", "lat": -15.5989, "lng": -56.0949}, {"nome": "CLAUDIO GILBERTO BARRETO", "cidade": "ARAGUARI", "estado": "MG", "endereco": "RUA JOAQUIM BARBOSA, Nº 1620, BAIRRO AMORIM, ARAGUARI - MG, CEP 38446-146", "telefone": "(34) 98866-6666", "lat": -18.6467, "lng": -48.1878}, {"nome": "MATHEUS FILIPE DE SOUSA 07285013684", "cidade": "ARAGUARI", "estado": "MG", "endereco": "RUA MAURO FARIA, Nº 20, BAIRRO MILLENIUM, ARAGUARI - MG, CEP 38447381", "telefone": "(34) 8899-6470", "lat": -18.6467, "lng": -48.1878}, {"nome": "POINT CAR AR CONDICIONADO AUTOMOTIVO", "cidade": "JUIZ DE FORA", "estado": "MG", "endereco": "AVENIDA DOUTOR SIMEÃO DE FARIAS, Nº 1763, BAIRRO SANTA CRUZ, JUIZ DE FORA - MG, CEP 36088-000", "telefone": "(32) 8871-6231", "lat": -21.7642, "lng": -43.3503}, {"nome": "MEC REPARAÇÃO AUTOMOTIVA LTDA", "cidade": "DUQUE DE CAXIAS", "estado": "RJ", "endereco": "ESTRADA SÃO LOURENÇO, S/N, QUADRA 01, CHÁCARA RIO PETRÓPOLIS, DUQUE DE CAXIAS - RJ, CEP: 25243-150 ( OBS: PARCEIRO MOVEL, LIGAR ANTES )", "telefone": "(21) 98357-9301", "lat": -22.7856, "lng": -43.3117}, {"nome": "MB SUL DISTRIBUIDORA DE COMPONENTES AUTOMOTIVOS LTDA", "cidade": "PORTÃO", "estado": "RS", "endereco": "RUA OSVINO, Nº 71, BAIRRO CENTRO, PORTÃO - RS, CEP: 93180-000", "telefone": "(51) 9506-6787", "lat": -29.6994, "lng": -51.2414}, {"nome": "EVITA LIMA RODRIGUES DA SILVA", "cidade": "UBERABA", "estado": "MG", "endereco": "RUA TIBURCIO TEIXEIRA DOS SANTOS, Nº 167, BAIRRO LARANJEIRAS, UBERABA - MG, CEP: 38046-394", "telefone": "( 34) 9663-4574", "lat": -19.7478, "lng": -47.9317}, {"nome": "IZAEL FERNANDES DOS SANTOS", "cidade": "MONTES CLAROS", "estado": "MG", "endereco": "RUA GROENLANDIA, Nº 849, BAIRRO INDEPENDENCIA, MONTES CLAROS - MG, CEP: 39.404-306", "telefone": "(38) 9876-4613", "lat": -16.7286, "lng": -43.8617}, {"nome": "CARLOS HENRIQUE FLORES DOS SANTOS", "cidade": "SALTO DE PIRAPORA", "estado": "SP", "endereco": "RUA EMILIANO DE ALMEIDA, Nº 59, BAIRRO RECANTO SÃO MANOEL 2, SALTO DE PIRAPORA - SP, CEP: 18165-068", "telefone": "(15) 99854-4261", "lat": -23.6467, "lng": -47.5733}, {"nome": "MIRIAM DAS DORES TOSCANO DE BRITO", "cidade": "CONSELHEIRO LAFAIETE", "estado": "MG", "endereco": "BR 040 KM 623, Nº 22980, BAIRRO SANTA CRUZ, CONSELHEIRO LAFAIETE - MG, CEP: 36407-430", "telefone": "(31) 8766-7414", "lat": -20.6611, "lng": -43.7886}, {"nome": "AUTO ELETRICA POSITIVO LTDA", "cidade": "RONDONÓPOLIS", "estado": "MT", "endereco": "AVENIDA CLAUDIO MANOEL DA COSTA, S/N, QUADRA ÁREA, LOTE 05, ÁREAS INTERNAS, BAIRRO VILA RICA, RONDONOPOLIS - MT, CEP: 78750-540", "telefone": "(66) 9 9695-1590", "lat": -16.4719, "lng": -54.6361}, {"nome": "L. B. AR CONDICIONADO PARA CAMINHOES LTDA", "cidade": "SANTO ESTEVÃO", "estado": "BA", "endereco": "AVENIDA RIO BAHIA, Nº 1438, BAIRRO SEDE, NO POSTO PIRAÍ, SANTO ESTEVÃO - BA, CEP: 44190-000", "telefone": "(75) 9868-5918", "lat": -12.4333, "lng": -39.2353}, {"nome": "MV TRUCK AR CONDICIONADO", "cidade": "SÃO LUÍS", "estado": "MA", "endereco": "AVENIDA EMILIANO MACIEIRA, , Nº 215, SALA 105, BAIRRO MARACANÃ, SÃO LUIS - MA, CEP: 65095-602", "telefone": "(98) 8295-7034", "lat": -2.5364, "lng": -44.3056}, {"nome": "CLIMACAR REFRIGERAÇÃO LTDA", "cidade": "BRASÍLIA", "estado": "DF", "endereco": "SOF NORTE QUADRA B LOJA 25, AO LADO DA LOJA LEROY MERLIN NORTE, BRASÍLIA - DF, CEP: 70634-520", "telefone": "(61) 3465-2531", "lat": -15.7942, "lng": -47.8825}, {"nome": "DANIEL DE PAULA GARCIA", "cidade": "ITOBI", "estado": "SP", "endereco": "RUA DOMINGOS DAMASCENO FILHO, Nº 1596, BAIRRO JARDIM CALDEIRÃO, ITOBI - SP, CEP: 13716-122", "telefone": "(19) 99278-5025", "lat": -21.7336, "lng": -46.9736}, {"nome": "CARLOS ROBERTO DE SOUZA", "cidade": "UBERLÂNDIA", "estado": "MG", "endereco": "AVENIDA REBELIÃO PRAIEIRA, Nº 190, BAIRRO SANTA ROSA, UBERLÃNDIA - MG, CEP: 38402-268", "telefone": "(34) 9981-8156", "lat": -18.9186, "lng": -48.2772}];

app.get('/api/assistencias-mapa', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ pontos: PONTOS_ASSISTENCIA });
  }
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const busca = norm(q);
  const filtrados = PONTOS_ASSISTENCIA.filter(p =>
    norm(p.cidade).includes(busca) || norm(p.estado).includes(busca) || norm(p.nome).includes(busca)
  );
  res.json({ pontos: filtrados });
});

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
- NUNCA mencione que um modelo, marca ou informação "não está na lista", "não foi encontrado no guia" ou qualquer limitação do sistema — responda sempre com confiança e naturalidade
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
- Resposta padrão para caminhão não listado: "Para o [modelo], você pode indicar ao cliente o Ar Slim Série 2. Para detalhes de instalação, a equipe técnica pode avaliar." NUNCA diga que o modelo não está na lista ou que não foi encontrado — responda direto com confiança.
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
Bateria mínima para instalação: 150A | Alternador mínimo: 90A (VALORES OFICIAIS — não alterar)
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
Para caminhões não listados aqui: recomende sempre o Ar Slim Série 2 com confiança, sem mencionar que o modelo não está na lista ou que não foi encontrado no guia.

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
- Qualquer outro caminhão → Ar Slim Série 2 recomendado, equipe técnica avalia instalação
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
Tensão: QUADRIVOLT — funciona em DC 12V, DC 24V e AC 100~240V automaticamente (NÃO perguntar voltagem)
Preço: único por modelo (não há variação por voltagem)
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
    m.includes('recomend') || m.includes('indicad') || m.includes('qual modelo') ||
    m.includes('ntg') || m.includes('actros') || m.includes('axor') || m.includes('atego') ||
    m.includes('tgx') || m.includes('tgs') || m.includes('stralis') || m.includes('tector') ||
    m.includes('cargo') || m.includes('atron') || m.includes('acello')
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
      m.includes('constellation') || m.includes('fh') || m.includes('modelo') ||
      m.includes('ntg') || m.includes('actros') || m.includes('axor') || m.includes('atego') ||
      m.includes('tgx') || m.includes('tgs') || m.includes('stralis') || m.includes('tector') ||
      m.includes('cargo') || m.includes('atron') || m.includes('acello')
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

    // Para depoimentos, não normaliza números (ex: 1620 não vira 1.620)
    const ehMsgDepoimento = /dep[ou]iment[oa]s?|foto de cliente|video de cliente/i.test(mensagemOriginal);
    const ultimaMensagem = ehMsgDepoimento
      ? mensagemOriginal.toLowerCase()
          .replace(/dep[ou]iment[oa]s?/gi, 'depoimento')
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
      : normalizarMensagem(mensagemOriginal);
    const RODAPE = '\n\nPosso ajudar em algo mais? 😊';

    // Detecta pedido de manual
    const pedidoManual = ultimaMensagem.includes('manual') || ultimaMensagem.includes('baixar') || ultimaMensagem.includes('download') || ultimaMensagem.includes('pdf');
    if (pedidoManual) {
      const sobreSlim = ultimaMensagem.includes('slim') || ultimaMensagem.includes('serie 2') || ultimaMensagem.includes('serie2');
      const sobreEco = ultimaMensagem.includes('eco') || ultimaMensagem.includes('compact');
      const sobreGeladeira = ultimaMensagem.includes('geladeira') || ultimaMensagem.includes('frigobar');
      const sobreGerador = ultimaMensagem.includes('gerador') || ultimaMensagem.includes('le-3000') || ultimaMensagem.includes('le3000');
      const sobreAr = (ultimaMensagem.includes('ar') || ultimaMensagem.includes('condicionado')) && !sobreGeladeira && !sobreGerador;

      const BASE = 'https://estiloar-suporte.onrender.com';
      const SLIM_PDF = `${BASE}/MANUAL%20AR%20SLIM%20SERIE%202.pdf`;
      const ECO_PDF = `${BASE}/MANUAL%20AR%20ECO%20COMPACT.pdf`;
      const GEL_PDF = `${BASE}/MANUAL%20GELADEIRAS.pdf`;
      const GER_PDF = `${BASE}/MANUAL%20GERADOR%2024V.pdf`;
      if (sobreSlim) return res.json({ reply: `Aqui está o manual do **Ar-Condicionado Slim Série 2**:\n\n${SLIM_PDF}${RODAPE}` });
      if (sobreEco) return res.json({ reply: `Aqui está o manual do **Ar-Condicionado Eco Compact**:\n\n${ECO_PDF}${RODAPE}` });
      if (sobreGeladeira) return res.json({ reply: `Aqui está o manual da **Geladeira Portátil**:\n\n${GEL_PDF}${RODAPE}` });
      if (sobreGerador) return res.json({ reply: `Aqui está o manual do **Gerador Digital 24V**:\n\n${GER_PDF}${RODAPE}` });
      if (sobreAr) {
        return res.json({ reply: `Qual manual você precisa?\n\n${SLIM_PDF}\n${ECO_PDF}${RODAPE}` });
      }
      // Manual sem produto especificado — lista todos
      return res.json({ reply: `Aqui estão todos os manuais disponíveis:\n\n📥 **Ar Slim Série 2:** ${SLIM_PDF}\n📥 **Eco Compact:** ${ECO_PDF}\n📥 **Geladeira Portátil:** ${GEL_PDF}\n📥 **Gerador Digital 24V:** ${GER_PDF}${RODAPE}` });
    }

    // Detecta pedido de preço/valor do ar sem modelo/voltagem especificados
    // Exclui geladeira, gerador — só dispara para ar-condicionado
    const sobreGeladeira = ultimaMensagem.includes('geladeira') || ultimaMensagem.includes('frigobar');
    const sobreGerador2 = ultimaMensagem.includes('gerador');
    const querPrecoAr = !sobreGeladeira && !sobreGerador2 &&
      (ultimaMensagem.includes('valor') || ultimaMensagem.includes('preco') || ultimaMensagem.includes('preço') || ultimaMensagem.includes('quanto')) &&
      ((/\bar\b/.test(ultimaMensagem)) || ultimaMensagem.includes('condicionado') || ultimaMensagem.includes('slim') || ultimaMensagem.includes('eco compact'));
    const jaTemVoltagem = ultimaMensagem.includes('12v') || ultimaMensagem.includes('12 v') || ultimaMensagem.includes('24v') || ultimaMensagem.includes('24 v');
    const jaTemModelo = ultimaMensagem.includes('slim') || ultimaMensagem.includes('serie 2') || ultimaMensagem.includes('eco compact');

    // Detecta pedido de preço da geladeira sem modelo especificado
    const querPrecoGeladeira = sobreGeladeira &&
      (ultimaMensagem.includes('valor') || ultimaMensagem.includes('preco') || ultimaMensagem.includes('preço') || ultimaMensagem.includes('quanto'));
    const jaTemModeloGeladeira = ultimaMensagem.includes('35') || ultimaMensagem.includes('45') || ultimaMensagem.includes('55');

    if (querPrecoGeladeira && !jaTemModeloGeladeira) {
      return res.json({ reply: `Qual o modelo da geladeira?\n\n• **35 litros**\n• **45 litros**\n• **55 litros**` });
    }

    if (querPrecoAr && !jaTemVoltagem && !jaTemModelo) {
      return res.json({ reply: `Para consultar o preço, preciso saber:\n\n**1. Qual modelo?**\n• Ar Slim Série 2\n• Ar Eco Compact\n\n**2. Qual a voltagem do caminhão?**\n• 12V\n• 24V` });
    }
    if (querPrecoAr && !jaTemVoltagem && jaTemModelo) {
      return res.json({ reply: `Qual a voltagem do caminhão do cliente? **12V** ou **24V**?` });
    }
    if (querPrecoAr && jaTemVoltagem && !jaTemModelo) {
      return res.json({ reply: `Qual o modelo desejado?\n\n• **Ar Slim Série 2**\n• **Ar Eco Compact**` });
    }

    // Detecta botão "Tenho uma dúvida" dos cards
    if (ultimaMensagem.trim() === 'tenho uma duvida' || ultimaMensagem.trim() === 'tenho uma dúvida') {
      return res.json({ reply: `Qual a sua dúvida? 😊` });
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
      // Ar sem modelo especificado — pergunta com botões
      if (produtoFoto === 'ar-sem-modelo-foto') {
        return res.json({ reply: `Para te enviar as fotos, preciso saber o modelo do ar-condicionado:\n[SUGESTOES]fotos do Slim Série 2|fotos do Eco Compact[/SUGESTOES]` });
      }
      const fotos = FOTOS_PRODUTOS[produtoFoto];
      if (fotos && fotos.length > 0) {
        const nomeProduto = produtoFoto === 'ecocompact' ? 'Eco Compact' :
          produtoFoto === 'geladeira' ? 'Geladeira Portátil' :
          produtoFoto === 'gerador' ? 'Gerador Digital 24V' : 'Ar Slim Série 2';
        const links = fotos.map((img, i) => `📷 **Foto ${i+1}**: ${img}`).join('\n');
        return res.json({ reply: `Entendi que você quer as fotos do **${nomeProduto}**. Aqui estão:\n\n${links}${RODAPE}` });
      }
    }

    // Detecta paginação com "+" — ex: "+1", "+2"
    if (/^\+\d*$/.test(ultimaMensagem.trim())) {
      // Busca a última localidade pesquisada no histórico do Pedro
      const ultimaRespostaBot = messages.slice().reverse().find(msg => msg.role === 'assistant')?.content || '';
      const matchLocal = ultimaRespostaBot.match(/(?:assistência técnica em|pontos em|pontos disponíveis para) \*\*([^*]+)\*\*/i);
      const localAnterior = matchLocal ? matchLocal[1].trim() : null;

      if (localAnterior) {
        const sessionId = 'pag_' + localAnterior.toLowerCase().replace(/\s+/g, '_');
        const ctx = paginacaoAssistencia.get(sessionId);

        if (ctx && ctx.offset < ctx.pontos.length) {
          const PAGINA = 6;
          const pagina = ctx.pontos.slice(ctx.offset, ctx.offset + PAGINA);
          const novoOffset = ctx.offset + pagina.length;
          const restantes = ctx.pontos.length - novoOffset;
          paginacaoAssistencia.set(sessionId, { ...ctx, offset: novoOffset });

          const lista = pagina.map(p =>
            `📍 **${p.nome}**\n📌 ${p.cidade} - ${p.estado}\n🏠 ${p.endereco}\n📞 ${p.telefone}`
          ).join('\n\n');

          const rodape = restantes > 0
            ? `\n\n_Ainda há **${restantes} ponto${restantes !== 1 ? 's' : ''}** restante${restantes !== 1 ? 's' : ''}. Digite **+1** para ver os próximos._`
            : `\n\n_Esses são todos os pontos disponíveis para **${localAnterior}**._`;

          return res.json({ reply: `Continuando... mais ${pagina.length} ponto${pagina.length !== 1 ? 's' : ''} em **${localAnterior}**:\n\n${lista}${rodape}` });
        }
      }
      return res.json({ reply: `Não há mais resultados para continuar. Faça uma nova busca de assistência técnica informando o estado ou cidade.` });
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
      const paginaKey = 'pag_' + queryFinal.toLowerCase().replace(/\s+/g, '_');

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
      paginacaoAssistencia.set(paginaKey, { offset: novoOffset, local: queryFinal, pontos: todos });

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
        rodape = `\n\n_Ainda há **${restantes} ponto${restantes !== 1 ? 's' : ''}** restante${restantes !== 1 ? 's' : ''}. Digite **+1** para ver os próximos._`;
      } else if (offset > 0) {
        rodape = `\n\n_Esses são todos os pontos disponíveis para **${queryFinal}**._`;
      }

      return res.json({ reply: `${intro}\n\n${lista}${rodape}` });
    }


    // ============================================================
    // ORIENTAÇÕES PARA MENSAGENS INCOMPLETAS
    // ============================================================

    // Imagem técnica do ar sem modelo
    const querImagemAr = (ultimaMensagem.includes('imagem tecni') || ultimaMensagem.includes('foto tecni') || ultimaMensagem.includes('imagem tecnica')) &&
      (ultimaMensagem.includes(' ar') || ultimaMensagem.includes('condicionado') || ultimaMensagem.endsWith('ar')) &&
      !ultimaMensagem.includes('geladeira') && !ultimaMensagem.includes('gerador') &&
      !ultimaMensagem.includes('slim') && !ultimaMensagem.includes('serie') && !ultimaMensagem.includes('eco') && !ultimaMensagem.includes('compact');
    if (querImagemAr) {
      return res.json({ reply: `Para te enviar a imagem técnica, preciso saber o modelo:
[SUGESTOES]imagem técnica do Slim Série 2|imagem técnica do Eco Compact[/SUGESTOES]` });
    }

    // Foto da geladeira sem modelo
    const querFotoGeladeira = (ultimaMensagem.includes('foto') || ultimaMensagem.includes('imagem')) &&
      ultimaMensagem.includes('geladeira') && !ultimaMensagem.includes('tecni') &&
      !ultimaMensagem.includes('35') && !ultimaMensagem.includes('45') && !ultimaMensagem.includes('55');
    if (querFotoGeladeira) {
      return res.json({ reply: `Para te enviar as fotos da geladeira, preciso saber o modelo:
[SUGESTOES]fotos da geladeira 35L|fotos da geladeira 45L|fotos da geladeira 55L[/SUGESTOES]` });
    }

    // Imagem técnica da geladeira sem modelo
    const querImagemGeladeira = (ultimaMensagem.includes('imagem tecni') || ultimaMensagem.includes('foto tecni')) &&
      ultimaMensagem.includes('geladeira') &&
      !ultimaMensagem.includes('35') && !ultimaMensagem.includes('45') && !ultimaMensagem.includes('55');
    if (querImagemGeladeira) {
      return res.json({ reply: `Para te enviar a imagem técnica da geladeira, preciso saber o modelo:
[SUGESTOES]imagem técnica da geladeira 35L|imagem técnica da geladeira 45L|imagem técnica da geladeira 55L[/SUGESTOES]` });
    }


    // Assistência técnica sem localidade
    const querAssistenciaSemLocal = palavrasAssistencia.some(p => ultimaMensagem.includes(p)) &&
      ultimaMensagem === ultimaMensagem.replace(/assistencia|assistência|tecnica|técnica|ponto|autorizado|autorizada|onde|conserto|quero|preciso|tem|temos|qual/gi, '').trim() === '';
    if (querAssistenciaSemLocal || (buscaAssistencia && queryFinal.trim().length < 2)) {
      return res.json({ reply: `Para buscar assistência técnica, preciso saber a cidade ou estado:
[SUGESTOES]assistência técnica em MG|assistência técnica em Uberaba|assistência técnica em São Paulo[/SUGESTOES]` });
    }

    // Detecta pedido de imagem técnica
    const produtoTecnico = detectarImagemTecnica(ultimaMensagem);
    if (produtoTecnico) {
      // Casos especiais sem imagem técnica
      if (produtoTecnico === 'geladeira-dimensoes') {
        return res.json({ reply: `Aqui estão as dimensões e pesos da Geladeira Portátil:\n\n• **Modelo 35L:** 647 x 400 x 441mm | Peso: 16,14 kg\n• **Modelo 45L:** 647 x 400 x 506mm | Peso: 16,5 kg\n• **Modelo 55L:** 647 x 400 x 571mm | Peso: 17,2 kg${RODAPE}` });
      }
      if (produtoTecnico === 'geladeira-sem-modelo') {
        return res.json({ reply: `Para te enviar a imagem técnica da geladeira, preciso saber o modelo:
[SUGESTOES]imagem técnica da geladeira 35L|imagem técnica da geladeira 45L|imagem técnica da geladeira 55L[/SUGESTOES]` });
      }
      if (produtoTecnico === 'ar-sem-modelo') {
        return res.json({ reply: `Para te enviar a imagem técnica, preciso saber o modelo:
[SUGESTOES]imagem técnica do Slim Série 2|imagem técnica do Eco Compact[/SUGESTOES]` });
      }
      const imagens = IMAGENS_TECNICAS[produtoTecnico];
      if (imagens && imagens.length > 0) {
        const nomeProduto = produtoTecnico.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const links = imagens.map((img, i) => `🖼️ **Imagem ${i+1}**: ${img}`).join('\n');
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

      // Se não tem marca na mensagem, tenta detectar via MODELOS_MARCAS
      const marcasDiretasDep = ['scania','volvo','mercedes','iveco','man','daf','ford','volkswagen','vw','hyundai','kia','fiat','renault','barco'];
      const temMarcaNaMensagem = marcasDiretasDep.some(m => ultimaMensagem.includes(m));
      let queryParaDrive = ultimaMensagem;
      if (!temMarcaNaMensagem) {
        const normQ = normIdx(ultimaMensagem);
        for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
          if (normQ.includes(normIdx(modelo))) {
            // Adiciona a marca automaticamente na query
            queryParaDrive = ultimaMensagem + ' ' + marca;
            break;
          }
        }
        // Também testa números soltos (ex: "1620" -> mercedes)
        const numMatch = normQ.match(/\b(\d{4})\b/);
        if (numMatch && !queryParaDrive.includes(' mercedes') && !queryParaDrive.includes(' scania')) {
          const num = numMatch[1];
          for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
            if (modelo === num || modelo === num.slice(0,2) + '.' + num.slice(2)) {
              queryParaDrive = ultimaMensagem + ' ' + marca;
              break;
            }
          }
        }
      }

      const resultados = buscarNoIndice(queryParaDrive);
      if (resultados && resultados.length > 0) {
        const aviso = resultados._aviso || `Encontrei ${resultados.length} pasta(s) no Drive:`;
        const links = resultados.map(r => `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`).join('\n');
        return res.json({ reply: `${aviso}\n\n${links}` });
      } else {
        return res.json({ reply: `Não encontrei depoimentos para essa marca ou modelo.\n\nVerifique se o nome foi escrito corretamente e tente novamente com a mensagem completa.\nExemplo: **"depoimento Scania NTG"** ou **"depoimento Mercedes 1620"**.` });
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
