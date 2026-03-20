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

function buscarNoIndice(query) {
  if (indiceDrive.length === 0) return null;
  const q = query.toLowerCase();

  let marcaBusca = '';
  let modeloBusca = '';
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(modelo)) {
      marcaBusca = marca;
      modeloBusca = modelo;
      break;
    }
  }

  const marcasDiretas = ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'volkswagen', 'vw', 'hyundai', 'fiat', 'renault', 'isuzu', 'kia'];
  if (!marcaBusca) {
    for (const marca of marcasDiretas) {
      if (q.includes(marca)) {
        marcaBusca = marca === 'vw' ? 'volkswagen' : marca;
        break;
      }
    }
  }

  if (marcaBusca) {
    if (modeloBusca) {
      const resultadosEspecificos = indiceDrive.filter(item =>
        item.marca.includes(marcaBusca) && item.modelo.includes(modeloBusca)
      );
      if (resultadosEspecificos.length > 0) return resultadosEspecificos;
    }
    const resultadosMarca = indiceDrive.filter(item => item.marca.includes(marcaBusca));
    if (resultadosMarca.length > 0) {
      resultadosMarca._aviso = modeloBusca ?
        `Não encontrei pasta específica para "${modeloBusca}", mas encontrei pastas da ${marcaBusca}:` :
        `Encontrei as seguintes pastas para ${marcaBusca}:`;
      return resultadosMarca;
    }
    return null;
  }

  const palavras = q.split(' ').filter(p => p.length >= 3);
  const resultados = indiceDrive.filter(item =>
    palavras.some(p => item.marca === p || item.modelo === p ||
      item.marca.startsWith(p) || item.modelo.startsWith(p))
  );
  return resultados.length > 0 ? resultados : null;
}

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

REGRAS CRÍTICAS:
- NUNCA invente informações, preços, depoimentos ou dados técnicos
- NUNCA busque informações em sites externos
- NUNCA mencione outras marcas ou concorrentes de produtos de ar-condicionado
- Use APENAS as informações fornecidas neste contexto
- Se não souber, diga honestamente que não tem essa informação disponível
- Sobre preços: use APENAS os dados da planilha fornecida
- NUNCA termine a resposta com sugestão de ligar para o telefone
- NUNCA termine com frases como "estou aqui para ajudar", "não hesite em perguntar" ou similares
- NUNCA faça perguntas no final da resposta
- NUNCA fale como se estivesse falando com o dono do caminhão — você está falando com o VENDEDOR
- NUNCA diga "seu caminhão", "sua cabine" — diga sempre "o caminhão do cliente", "a cabine do cliente"

REGRA PARA RECOMENDAÇÃO DE AR POR CAMINHÃO:
- Os caminhões listados no guia têm regras específicas — siga EXATAMENTE o guia
- Para caminhão NÃO listado no guia: recomende o Ar Slim Série 2, SEM explicar o produto, SEM inventar detalhes de instalação
- Resposta padrão para caminhão não listado: "Para o [modelo], você pode indicar ao cliente o Ar Slim Série 2. Para detalhes de instalação, a equipe técnica pode avaliar."
- NUNCA associe modelos a marcas erradas

MARCAS E MODELOS DE CAMINHÕES DO MERCADO BRASILEIRO (para reconhecimento — NÃO invente regras de instalação para estes):

MERCEDES-BENZ: Actros (2546, 2548, 2651, 2658), Axor (2544, 2546, 2640, 2644), Atego (1419, 1719, 2426), Accelo (815, 1016, 1316, 1017, 1317), OF (1519, 1621, 1718, 1722, 2726), 1113, 1313, 1513, 1620, 1630, 1933, 2213, 2423, 2633, 710, 712, 914, 915

VOLVO: FH (420, 460, 500, 540), FM (370, 410, 460), FMX (370, 410, 460, 500), VM (270, 310, 330), NH (12 380)

SCANIA: R (410, 450, 480, 500, 540, 560, 580), S (410, 450, 500, 540, 580, 660), G (360, 410, 450, 500), P (250, 280, 310, 360, 410), L (280, 320), Highline, Streamline, NextGen

VOLKSWAGEN: Constellation (17.180, 17.230, 19.360, 24.280, 24.330, 25.390, 26.420, 31.390), Delivery (6.160, 9.170, 11.180, 13.180), Worker (17.220, 17.230, 24.250, 24.280, 31.320), Meteor (29.520)

IVECO: Tector (170E22, 170E28, 240E28, 240E30), Stralis (480, 510, 570, 600), Daily (35S14, 35S17, 50C17, 70C17), Hi-Way, Hi-Road, S-Way, T-Way, Vertis

FORD: Cargo (816, 1119, 1317, 1319, 1519, 1722, 1723, 2042, 2428, 2629, 3132), Transit (furgão)

MAN: TGX (28.440, 29.440, 33.440), TGS (26.360, 26.440, 33.360), TGM (13.250, 15.250, 18.250, 26.290), TGL (8.180, 10.180, 12.180)

HYUNDAI: HR (2.5 TCI), HD (65, 78, 120, 170)

KIA: Bongo (K2500, K2700, K3000)

DAF: XF (105, 106, 530), CF (85, 330, 340, 370, 410), LF (45, 55)

AGRALE: Agrale 6000, 7500, 8500, 9200, 10000, MA 8.5, MA 10, Marruá

FIAT: Ducato (cargo, minibus), Fiorino (furgão), Doblô (cargo)

RENAULT: Master (furgão, chassi, plataforma), Kangoo (express)

NISSAN: Frontier (pickup), NP300

TOYOTA: Hilux (pickup), Land Cruiser

MITSUBISHI: L200 Triton, Canter (FE, FG)
`;

const SECOES = {

  ar_slim_geral: `
PRODUTO: AR-CONDICIONADO 100% ELÉTRICO SLIM SÉRIE 2
Marca: Estilo AR | Modelos: 12V e 24V
Capacidade: 9.500 BTUs
Capacidade de Refrigeração: 12V = 2.150W | 24V = 2.560W
Tensão nominal: DC 12V / DC 24V
Fluxo de ar evaporador: 400m³/h | Condensador: 2.000m³/h
Gás refrigerante: R134a | Carga: 460g | Óleo: RH68
Dimensões: 97 x 85,8 x 15 cm
Furo instalação: mín 460x400mm / máx 545x937mm
Garantia: 3 meses
`,

  ar_slim_consumo: `
CONSUMO DE ENERGIA — AR SLIM SÉRIE 2:
Modo Econômico: 12V=240W/20A | 24V=288W/12A
Modo Automático: 12V=600W/50A | 24V=840W/35A
Modo Turbo: 12V=720W/60A | 24V=960W/40A
`,

  ar_slim_operacao: `
COMO USAR O AR SLIM SÉRIE 2:
- Ligar/Desligar: pressionar brevemente o botão de energia
- Velocidade ventilador: 5 velocidades (1-2-3-4-5)
- Iluminação: pressionar brevemente | segurar = oscilação vertical
- Modo: alterna Econômico, Automático, Turbo
- Temperatura: botões + e - | faixa 5°C a 32°C
- Ver temp entrada: segurar botão temperatura +
- Ver temp saída: segurar botão temperatura -
- Proteção baixa tensão: segurar botão velocidade 6 segundos, usar +/-
- Padrão fábrica: 20,5V (24V) / 10,5V (12V) | Ajustável: 9-28V
- Código LU: bateria baixa — desligar e ligar para resetar
MODOS:
- TURBO: capacidade máxima, consumo máximo
- AUTOMÁTICO: regula automaticamente conforme temperatura
- ECO: limita consumo, ideal motor parado
`,

  ar_slim_erros: `
ERROS DO AR SLIM SÉRIE 2:
E2: Dissipação insuficiente → compressor/ventilador com falha
- Sem energia no fio ventilador: substituir controlador
- Com energia no ventilador: substituir ventilador
- Compressor não parte: verificar circuito, parafusos; se ok substituir controlador; se persistir: compressor queimado

E3: Proteção de bloqueio → compressor travado ou tubulação bloqueada
- Compressor vibra e não parte: detritos no sistema, substituir compressor e limpar sistema
- Pressão normal: 10-15mpa | Se >20mpa: condensador bloqueado | Se ~0: válvula de expansão

E4: Baixa voltagem controlador → tensão abaixo de 20,5V (24V) ou 10,5V (12V)
- Carregar bateria ou aumentar amperagem do alternador
- Verificar fios soltos ou oxidados nos terminais
- Se tensão ok e persiste: substituir controlador

E5: Sobrecorrente do controlador → curto interno ou instabilidade de tensão
- Substituir controlador | Verificar conexões soltas | Verificar condensador obstruído

E6: Sobrecarga do ventilador → pás travadas ou curto interno
- Verificar se pás giram livremente; se travado substituir ventilador
- Desconectar plugue do ventilador e reiniciar; se funciona sem erro: substituir ventilador

E7: Perda de fase do compressor → chicote, bobina ou controlador com problema
- Verificar terminais com mau contato ou parafusos soltos
- Usar multímetro para medir fios do motor trifásico
- Se circuito aberto: substituir compressor | Se fiação ok: substituir controlador

E8: Falha de pressão → vazamento de gás ou interruptor de pressão danificado
E9: Sobrecorrente do ventilador → escovas desgastadas ou rolamentos travados
E10: Falha de pressão → verificar vazamento de gás refrigerante
E11: Sobrecarga → desligar a energia e religar

LU: Baixa tensão → bateria baixa ou placa defeituosa
SHr: Problema sensor ou painel de controle
OPE: Circuito aberto sensor → plugue desconectado ou cabo quebrado

AR NÃO GELA:
- Alta pressão alta: ventilador com falha ou condensador sujo
- Alta pressão baixa: falta refrigerante → reabastecer
- Alta alta E baixa baixa: compressor danificado → substituir
`,

  ar_slim_manutencao: `
MANUTENÇÃO DO AR SLIM SÉRIE 2:
- Alternador mínimo 12V: 85-90A
- Não instalar em tetos inclinados maiores que 30°
- Tetos irregulares: usar selante de poliuretano
- A cada 3 meses: inspecionar conexões elétricas, terminais e bornes
`,

  ar_slim_instalacao: `
INSTALAÇÃO DO AR SLIM SÉRIE 2:
1. Remover teto solar e limpar ao redor do buraco
2. Aplicar borrachão de vedação e cola impermeável nas bordas
3. Colocar equipamento centralizado acima do teto solar
4. Encaixar luva de tração e apertar com 4 porcas M10
5. Colocar placa decorativa e apertar com 4 porcas M10
6. Fio VERMELHO → positivo (+) | Fio PRETO → negativo (-)
DRENO: atentar para queda natural da mangueira
CHICOTE: ligar direto nas baterias, não alterar o chicote
`,

  instalacao_por_caminhao: `
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
Recomendado para cabines menores.
(Manual completo em breve)
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
    if (m.includes('eco') && m.includes('compact')) {
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
    } else if (m.includes('erro') || m.includes('falha') || m.match(/\be\d+\b/) || m.includes('lu') || m.includes('shr') || m.includes('ope') || m.includes('não gela') || m.includes('nao gela')) {
      secoes.push(SECOES.ar_slim_geral);
      secoes.push(SECOES.ar_slim_erros);
    } else if (m.includes('consumo') || m.includes('bateria') || m.includes('ampere') || m.includes('watt')) {
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

    // Detecta Volvo FH com ano 2016+
    const fhMatch = ultimaMensagem.match(/fh\s*(20\d{2})/i) || ultimaMensagem.match(/(20\d{2})\s*fh/i);
    if (fhMatch) {
      const ano = parseInt(fhMatch[1]);
      if (ano >= 2016) {
        return res.json({ reply: `Para o Volvo FH ${ano}, oriente seu cliente que esse modelo possui teto solar de fábrica, o que torna a instalação mais complexa. Recomendo encaminhar para análise da nossa equipe técnica antes de fechar a venda. 😊` });
      }
    }

    // Detecta Volvo FH sem ano — pergunta o ano
    const mencionaFH = ultimaMensagem.includes('volvo fh') || ultimaMensagem.includes(' fh ') ||
                       ultimaMensagem.includes(' fh') || ultimaMensagem.endsWith('fh') ||
                       ultimaMensagem.startsWith('fh ');
    const temAno = /20\d{2}/.test(ultimaMensagem);
    if (mencionaFH && !temAno) {
      return res.json({ reply: `Para o Volvo FH, o ano faz diferença na instalação. Qual o ano do caminhão do seu cliente? 😊` });
    }

    // Detecta pedido de imagem técnica
    const produtoTecnico = detectarImagemTecnica(ultimaMensagem);
    if (produtoTecnico) {
      const imagens = IMAGENS_TECNICAS[produtoTecnico];
      if (imagens && imagens.length > 0) {
        const links = imagens.map((img, i) => `🖼️ **Imagem ${i+1}**: ${img}`).join('\n');
        return res.json({ reply: `Aqui estão as imagens técnicas:\n\n${links}` });
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
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API' });
    res.json({ reply: data.choices?.[0]?.message?.content || 'Sem resposta.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
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
