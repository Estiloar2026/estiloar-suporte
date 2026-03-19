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

// Busca no índice — só retorna resultados com match real
function buscarNoIndice(query) {
  if (indiceDrive.length === 0) return null;
  const q = query.toLowerCase();

  // Tenta encontrar marca pelo mapeamento de modelos
  let marcaBusca = '';
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(modelo)) { marcaBusca = marca; break; }
  }

  // Marcas diretas mencionadas na mensagem
  const marcasDiretas = ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'volkswagen', 'vw', 'hyundai', 'fiat', 'renault', 'isuzu'];
  if (!marcaBusca) {
    for (const marca of marcasDiretas) {
      if (q.includes(marca)) { marcaBusca = marca === 'vw' ? 'volkswagen' : marca; break; }
    }
  }

  // Se encontrou marca, filtra só por ela
  if (marcaBusca) {
    const resultados = indiceDrive.filter(item => item.marca.includes(marcaBusca));
    return resultados.length > 0 ? resultados : null;
  }

  // Se não encontrou marca específica, busca por palavras com pelo menos 3 letras
  // mas só se tiver match exato em marca ou modelo
  const palavras = q.split(' ').filter(p => p.length >= 3);
  const resultados = indiceDrive.filter(item =>
    palavras.some(p => item.marca === p || item.modelo === p ||
      item.marca.startsWith(p) || item.modelo.startsWith(p))
  );

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


// ============================================================
// BANCO DE CONHECIMENTO — separado por seções
// ============================================================

const CONTEXTO_BASE = `
Você é o Pedro, assistente de suporte de vendas da Estilo AR.
Você é um ser humano. Nunca diga que é IA ou robô. Se perguntarem, diga que é o Pedro do time de suporte da Estilo AR.

JEITO DE SER:
- Simpático, acolhedor e paciente como um bom atendente brasileiro
- Fala de forma natural e coloquial mas profissional
- Usa "você", "tá", "beleza", "ótimo", "claro", "pode deixar"
- Demonstra empatia antes de dar a solução
- Celebra quando resolve: "Que ótimo! Fico feliz que deu certo!"
- Usa emojis com moderação
- Para problemas graves sugere ligar: (34) 3293-8000
- Sempre responde em português brasileiro

EMPRESA: Estilo AR | Tel: (34) 3293-8000 | Seg-Sex 08h-18h | www.estiloar.com.br | Uberlândia-MG

REGRAS CRÍTICAS:
- NUNCA invente informações, preços, depoimentos ou dados técnicos
- NUNCA busque informações em sites externos
- NUNCA mencione outras marcas ou concorrentes
- Use APENAS as informações fornecidas neste contexto
- Se não souber, diga honestamente e sugira ligar para (34) 3293-8000
- Sobre preços: use APENAS os dados da planilha fornecida

PRODUTOS DA ESTILO AR: Ar-Condicionado 100% Elétrico, Ar-Condicionado Eco Compact, Geladeira Portátil (35L/45L/55L) e Gerador Digital 24V.
`;

const SECOES = {

  ar_eletrico: `
PRODUTO: AR-CONDICIONADO 100% ELÉTRICO
(Manual em atualização — para dúvidas técnicas sugira ligar para (34) 3293-8000)
`,

  eco_compact: `
PRODUTO: AR-CONDICIONADO ECO COMPACT
(Manual em breve — para dúvidas técnicas sugira ligar para (34) 3293-8000)
`,

  geladeira_geral: `
PRODUTO: GELADEIRA PORTÁTIL
Modelos: 35L, 45L e 55L
Tensão: DC 12V/24V ou AC 100~240V (usar adaptador especial para AC)
Resfriamento rápido até -20°C | Potência: 60W | Ruído: menor que 45dB
Faixa de temperatura: -20°C a +20°C
Display digital com temperatura dupla | Duas zonas independentes (esquerda e direita)
O lado com o compressor é a caixa direita
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
- Alternar entre caixas: pressionar botão de configuração
- Se nenhuma operação em 4 segundos: sai do modo de configuração automaticamente
- Modos: HH (resfriamento rápido, padrão) e ECO (economia)
- Para alternar modos: pressionar brevemente o botão de configuração
- Proteção bateria: segurar botão config por 3 segundos, selecionar Baixo/Médio/Alto
- Padrão fábrica proteção: Alto
- Conversão Celsius/Fahrenheit: segurar 3 segundos no status desabilitado até E1, navegar até E5
- Restaurar fábrica: desligada, segurar 3 segundos até E1, pressionar + e - juntos por 3 segundos
`,

  geladeira_bateria: `
PROTEÇÃO DE BATERIA DA GELADEIRA:
Recomendação: Alto quando no veículo | Médio/Baixo com bateria externa
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
F1 - Baixa tensão: desligar interruptor de proteção. Bateria: H=alta, M=média, L=baixa
F2 - Sobrecarga ventilador: desligar 5 min e religar. Se persistir: pós-venda
F3 - Compressor protegendo: desligar 5 min e religar. Se persistir: pós-venda
F4 - Velocidade compressor baixa/carga grande: desligar 5 min e religar. Se persistir: pós-venda
F5 - Temperatura alta no compressor: local ventilado, desligar 5 min. Se persistir: pós-venda
F6 - Controlador sem parâmetros: desligar 5 min e religar. Se persistir: pós-venda
F7/F8 - Sensor temperatura anormal: contatar pós-venda
`,

  geladeira_problemas: `
PROBLEMAS COMUNS DA GELADEIRA:
Não funciona: verificar botão liga/desliga, plugue, fusível e fonte de alimentação
Temperatura muito alta: não abrir porta com frequência, não colocar alimentos quentes
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
ARMAZENAMENTO LONGO: desligar, esvaziar, limpar, local seco e ventilado, deixar tampa levemente aberta
`,

  geladeira_seguranca: `
PRECAUÇÕES DA GELADEIRA:
- Não usar se danificado | Não expor à chuva ou água | Não colocar perto de chamas ou calor
- Após desembalar: aguardar 6 horas antes de ligar
- Inclinação máxima uso prolongado: menor que 5° | uso curto: menor que 45°
- Ventilação: traseira ≥20cm | lateral ≥10cm
- Crianças devem operar sob supervisão
- Instalação e manutenção só por pessoal qualificado
`,

  gerador_geral: `
PRODUTO: GERADOR DIGITAL 24V
Modelos: LE-3000i e LE-3000i Pro
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
- Não usar em ambiente úmido
- Manter combustível a pelo menos 1m de distância
- Parar o motor ANTES de reabastecer
- Não fumar durante o reabastecimento
- Gerador NÃO vem com óleo da fábrica: NUNCA ligar sem colocar óleo primeiro
- Durante carregamento: não fumar, não conectar/desconectar da bateria
`,

  gerador_operacao: `
COMO USAR O GERADOR:
- Ligar imediatamente: interruptor para "Ligar"
- Modo automático: liga quando bateria cai abaixo de 23V/24V/25V (configurável)
- Desligar: interruptor para "Desligar"
- No modo automático: para quando geração cai abaixo de 800W
- Fio vermelho → terminal positivo (+) | Fio preto → terminal negativo (-)
- NUNCA inverter os polos
- Conexão Bluetooth: ligar Bluetooth do telefone e autorizar permissões
`,

  gerador_luzes: `
LUZES INDICADORAS DO GERADOR:
Verde normal: operação normal
Verde 3x: modo automático ativo
Verde 2x: condições de parada automática atendidas
1 vermelho 2 verdes: modo manual
Vermelho 2x: curto-circuito → verificar fios trifásicos, substituir controlador se persistir
Vermelho 3x: anormalidade linha de fase → verificar fios e ponte retificadora
4 vermelhos 3 verdes: anomalia inicialização → verificar fusível 25A e se motor gira
Vermelho 5x: sobretensão → bateria acima de 31V
Vermelho 6x: detecção velocidade → verificar fio de extinção
Vermelho 7x: subtensão bateria → bateria descarregada (abaixo de 8V) ou danificada
2 vermelhos 1 verde: verificar fiação
3 vermelhos 2 verdes: corrente alta → verificar terminais e rotor
5 vermelhos 1 verde: sobretensão na geração → medir voltagem, verificar motor de passo
6 vermelhos 1 verde: motor não liga → verificar carburador, vela, fio de extinção
7 vermelhos 1 verde: subtensão na geração → verificar sobrecarga e fios
Luz óleo acesa: óleo insuficiente → adicionar imediatamente
3 vermelhos 3 verdes: óleo insuficiente (Bluetooth)
3 vermelhos 5 verdes: alarme vazamento gasolina (Bluetooth)
`,

  gerador_manutencao: `
MANUTENÇÃO DO GERADOR:
Sempre: verificar combustível e óleo antes de usar
Mensal/20h: verificar e adicionar óleo | limpar filtro de ar
Trimestral/50h: substituir óleo | limpar vela de ignição
100h: ajustar válvulas | limpar depósito de combustível
Em altas temperaturas/cargas: trocar óleo a cada 25h
Em ambientes poeirentos: limpar filtro de ar a cada 10h

SUBSTITUIÇÃO DO ÓLEO: aquecer motor, desligar, inclinar para drenar, recolocar na horizontal, adicionar 0,4L de SJ10W-40
FILTRO DE AR: remover, limpar com solvente, secar, adicionar óleo, espremer excesso, reinstalar
`,

  gerador_problemas: `
MOTOR DO GERADOR NÃO ARRANCA:
1. Sem combustível → reabastecer
2. Filtro entupido → limpar filtro de combustível
3. Carburador entupido → limpar carburador
4. Óleo baixo → adicionar óleo
5. Vela com carbono ou umidade → limpar e secar a vela
6. Problema no sistema de ignição → contatar fabricante

ARMAZENAMENTO: até 1 mês=nenhuma prep | 1-2 meses=trocar gasolina | 2 meses-1 ano=drenar carburador também | mais de 1 ano=tudo + drenar internamente
`,

};

// Seleciona as seções relevantes para a pergunta
function selecionarContexto(mensagem) {
  const m = mensagem.toLowerCase();
  const secoes = [CONTEXTO_BASE];

  // Geladeira
  if (m.includes('geladeira') || m.includes('frigobar') || m.includes('refrigerador') ||
      m.match(/\b(35|45|55)l?\b/)) {

    secoes.push(SECOES.geladeira_geral);

    if (m.match(/\b(35|45|55)\b/) || m.includes('peso') || m.includes('dimens') || m.includes('medida') || m.includes('tamanho'))
      secoes.push(SECOES.geladeira_dimensoes);

    if (m.includes('f1') || m.includes('f2') || m.includes('f3') || m.includes('f4') ||
        m.includes('f5') || m.includes('f6') || m.includes('f7') || m.includes('f8') ||
        m.includes('erro') || m.includes('falha') || m.includes('código'))
      secoes.push(SECOES.geladeira_erros);

    if (m.includes('não funciona') || m.includes('nao funciona') || m.includes('problema') ||
        m.includes('som') || m.includes('água') || m.includes('gota') || m.includes('congelando'))
      secoes.push(SECOES.geladeira_problemas);

    if (m.includes('bateria') || m.includes('tensão') || m.includes('voltagem') || m.includes('proteção'))
      secoes.push(SECOES.geladeira_bateria);

    if (m.includes('temperatura') || m.includes('carne') || m.includes('fruta') || m.includes('bebida'))
      secoes.push(SECOES.geladeira_temperatura);

    if (m.includes('como usar') || m.includes('ligar') || m.includes('desligar') || m.includes('configurar') ||
        m.includes('modo') || m.includes('eco') || m.includes('hh') || m.includes('celsius') || m.includes('fahrenheit'))
      secoes.push(SECOES.geladeira_operacao);

    if (m.includes('limpar') || m.includes('limpeza') || m.includes('desgel') || m.includes('guardar') || m.includes('armazenar'))
      secoes.push(SECOES.geladeira_manutencao);

    if (m.includes('segurança') || m.includes('cuidado') || m.includes('atenção') || m.includes('perigo'))
      secoes.push(SECOES.geladeira_seguranca);

    // Se pergunta genérica sem contexto específico
    if (secoes.length === 2) {
      secoes.push(SECOES.geladeira_operacao);
      secoes.push(SECOES.geladeira_dimensoes);
    }
  }

  // Gerador
  else if (m.includes('gerador') || m.includes('le-3000') || m.includes('le3000') || m.includes('combustível') || m.includes('combustivel')) {

    secoes.push(SECOES.gerador_geral);

    if (m.includes('luz') || m.includes('pisca') || m.includes('vermelho') || m.includes('verde') ||
        m.includes('indicador') || m.includes('painel') || m.includes('erro') || m.includes('falha'))
      secoes.push(SECOES.gerador_luzes);

    if (m.includes('não arranca') || m.includes('nao arranca') || m.includes('não liga') ||
        m.includes('nao liga') || m.includes('problema') || m.includes('armazenamento'))
      secoes.push(SECOES.gerador_problemas);

    if (m.includes('óleo') || m.includes('oleo') || m.includes('manutenção') || m.includes('manutencao') ||
        m.includes('filtro') || m.includes('vela') || m.includes('trocar'))
      secoes.push(SECOES.gerador_manutencao);

    if (m.includes('como usar') || m.includes('ligar') || m.includes('desligar') || m.includes('automático') ||
        m.includes('bateria') || m.includes('carregar') || m.includes('bluetooth'))
      secoes.push(SECOES.gerador_operacao);

    if (m.includes('segurança') || m.includes('perigo') || m.includes('cuidado') || m.includes('fechado'))
      secoes.push(SECOES.gerador_seguranca);

    // Se pergunta genérica
    if (secoes.length === 2) {
      secoes.push(SECOES.gerador_operacao);
      secoes.push(SECOES.gerador_seguranca);
    }
  }

  // Ar-condicionado
  else if (m.includes('ar') || m.includes('condicionado') || m.includes('elétrico') || m.includes('eletrico') ||
           m.includes('eco compact') || m.includes('ecocompact')) {

    if (m.includes('eco') || m.includes('compact'))
      secoes.push(SECOES.eco_compact);
    else
      secoes.push(SECOES.ar_eletrico);
  }

  // Pergunta genérica — inclui contexto básico de todos os produtos
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
      // Se índice vazio, tenta construir
      if (indiceDrive.length === 0) {
        try {
          await construirIndice();
        } catch (err) {
          console.error('Erro ao construir índice:', err);
          return res.json({ reply: `No momento não consigo acessar os depoimentos. Por favor ligue para **(34) 3293-8000**. 😊` });
        }
      }

      // Só busca se o índice foi construído com sucesso
      if (indiceDrive.length === 0) {
        return res.json({ reply: `No momento não consigo acessar os depoimentos. Por favor ligue para **(34) 3293-8000**. 😊` });
      }

      const resultados = buscarNoIndice(ultimaMensagem);

      // Só retorna se tiver resultados reais no índice
      if (resultados && resultados.length > 0) {
        const links = resultados.map(r => `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`).join('\n');
        return res.json({ reply: `Encontrei ${resultados.length} pasta(s) no Drive:\n\n${links}\n\nQualquer dúvida é só chamar! 😊` });
      } else {
        return res.json({ reply: `Não encontrei depoimentos para essa marca ou modelo. Para mais informações ligue para **(34) 3293-8000**. 😊` });
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

    // Seleciona só o contexto relevante para a pergunta
    const dadosPlanilha = await buscarDadosPlanilha();
    const contextoRelevante = selecionarContexto(ultimaMensagem);
    const contexto = contextoRelevante + `\n========\nDADOS DA PLANILHA (preços/promoções/pagamento):\n${dadosPlanilha || 'Indisponível — sugira ligar para (34) 3293-8000'}`;

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
