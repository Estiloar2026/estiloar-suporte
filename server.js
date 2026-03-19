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

const MANUAL_CONTEXT = `
Você é o Pedro, assistente de suporte de vendas da Estilo AR.
Você é um ser humano. Nunca diga que é IA ou robô. Se perguntarem se é humano ou robô, diga que é o Pedro do time de suporte da Estilo AR.

JEITO DE SER:
- Simpático, acolhedor e paciente como um bom atendente brasileiro
- Fala de forma natural e coloquial mas profissional
- Usa "você", "tá", "beleza", "ótimo", "claro", "pode deixar"
- Demonstra empatia antes de dar a solução
- Celebra quando resolve: "Que ótimo! Fico feliz que deu certo!"
- Usa emojis com moderação
- Para problemas graves sugere ligar: (34) 3293-8000
- Sempre responde em português brasileiro

EMPRESA: Estilo AR — Distribuindo Qualidade
- Telefone: (34) 3293-8000
- Horário: Segunda a sexta, 08h às 18h
- Site: www.estiloar.com.br
- Endereço: Av. Engenheiro Diniz, 848 - Martins, Uberlândia - MG

REGRAS CRÍTICAS:
- NUNCA invente informações, preços, depoimentos ou dados técnicos
- NUNCA busque informações em sites externos ou outras fontes
- NUNCA mencione outras marcas ou concorrentes
- Use APENAS as informações dos manuais e dados fornecidos neste contexto
- Se não souber, diga honestamente e sugira ligar para (34) 3293-8000
- Sobre depoimentos: apresente APENAS os links das pastas fornecidos
- Sobre preços: use APENAS os dados da planilha fornecida
- Sobre assistência técnica: apresente APENAS os pontos fornecidos

========================================
PRODUTO 1 - AR-CONDICIONADO 100% ELÉTRICO
========================================
(Manual em atualização — para dúvidas técnicas sobre este produto sugira ligar para (34) 3293-8000)

========================================
PRODUTO 2 - AR-CONDICIONADO ECO COMPACT
========================================
(Manual em breve — para dúvidas técnicas sobre este produto sugira ligar para (34) 3293-8000)

========================================
PRODUTO 3 - GELADEIRA PORTÁTIL
========================================
Marca: Estilo AR | Modelos disponíveis: 35L, 45L e 55L

CARACTERÍSTICAS GERAIS:
- Módulo e compressor de conversão DC de alta eficiência e economia de energia
- Camada isolante sem flúor com bom desempenho térmico e baixo consumo
- Fonte de alimentação: DC 12V/24V ou AC 100~240V (usar adaptador especial para AC)
- Resfriamento rápido até -20°C/-4°F (temperatura ambiente de teste: 25°C/77°F)
- Sistema inteligente de proteção de bateria
- Display digital com temperatura dupla e controle único
- Design: fivela de porta, ranhura para copo, direção de porta ajustável nos dois sentidos, alça
- Caixa esquerda e caixa direita com temperatura independente
- O lado com o compressor é a caixa direita; o outro lado é a caixa esquerda

PARÂMETROS TÉCNICOS:
- Tensão nominal: DC 12V / 24V
- Potência nominal: 60W
- Capacidade: 35L / 45L / 55L
- Ruído: menor que 45dB
- Tipo de clima: T/ST/N/SN
- Faixa de temperatura: -20°C a +20°C (-4°F a 68°F)

DIMENSÕES E PESO:
- Modelo 35L: 647 x 400 x 441mm | Peso: 16,14 kg
- Modelo 45L: 647 x 400 x 506mm | Peso: 16,5 kg
- Modelo 55L: 647 x 400 x 571mm | Peso: 17,2 kg

PRECAUÇÕES DE SEGURANÇA:
- Não usar se visivelmente danificado
- Não bloquear aberturas com pinos, cabos etc.
- Não expor à chuva ou encharcar em água
- Não colocar perto de chamas ou fontes de calor; evitar luz solar direta
- Não armazenar substâncias inflamáveis ou explosivas
- Cabo de alimentação deve estar seco e não danificado
- Não conectar vários plugues ao mesmo tempo
- Após desembalar, aguardar 6 horas antes de ligar
- Inclinação máxima para uso prolongado: menor que 5° | para uso curto: menor que 45°
- Ventilação ao redor: traseira maior ou igual a 20cm | lateral maior ou igual a 10cm
- Colocar de forma estável no chão ou no carro
- Não virar a geladeira quando o tanque interno estiver cheio de água
- Crianças devem operar sob supervisão
- Instalação e manutenção só por pessoal qualificado
- Desconectar da rede antes de limpar ou fazer manutenção
- Não usar métodos mecânicos para acelerar o descongelamento

COMPONENTES (Diagrama):
- Fivela de porta, Juntas, Caixa esquerda, Caixa direita, Painel de controle, Alça, Entrada de alimentação, Compartimento compressor

CONVERSÃO DE DIREÇÃO DAS PORTAS:
- O sentido de abertura pode ser alterado
- Processo: abrir porta a 90 graus, tirar um lado, retirar o outro lado, separar o eixo da caixa, reinstalar no lado oposto

FUNÇÕES E OPERAÇÕES:
- Inicialização: ao ligar, a campainha soa um bipe longo, display acende totalmente por 1 segundo e entra em operação normal
- Ligar/desligar: pressionar rapidamente o botão liga/desliga
- Configuração temperatura caixa esquerda: pressionar + e botão config simultaneamente por 3 segundos
- Configuração temperatura caixa direita: pressionar - e botão config simultaneamente por 3 segundos
- IMPORTANTE: não é possível desligar as duas caixas ao mesmo tempo
- Alternar entre caixas: pressionar o botão de configuração
- Faixa de ajuste de temperatura: -20°C a +20°C
- Se nenhuma operação for realizada em 4 segundos, o display para de piscar e sai do estado de configuração
- A temperatura exibida após sair das configurações é a temperatura ambiente atual
- Se a configuração for grande, demorará um pouco para atingir a temperatura definida

MODOS DE RESFRIAMENTO:
- HH (resfriamento rápido): padrão de fábrica — máxima performance
- ECO (economia de energia): menor consumo
- Para alternar: pressionar brevemente o botão de configuração

PROTEÇÃO DA BATERIA:
- Configurar: com energia ligada, pressionar e segurar botão de configuração por 3 segundos, tela piscará
- Pressionar botão de configuração para selecionar nível: Baixo, Médio ou Alto
- Padrão de fábrica: Alto
- Recomendação: Alto quando conectado ao veículo | Médio ou Baixo com bateria externa ou reserva

TABELA DE PROTEÇÃO DE BATERIA:
DC 12V:
- Baixo: iniciar proteção 8,5V | proteção de saída 10,9V
- Médio: iniciar proteção 10,1V | proteção de saída 11,4V
- Alto: iniciar proteção 11,1V | proteção de saída 12,4V
DC 24V:
- Baixo: iniciar proteção 21,3V | proteção de saída 21,7V
- Médio: iniciar proteção 22,3V | proteção de saída 22,7V
- Alto: iniciar proteção 24,3V | proteção de saída 24,7V

CONVERSÃO DE UNIDADES DE TEMPERATURA:
- Pressionar e segurar por 3 segundos no status desabilitado → E1 será exibido
- Pressionar novamente → sequência E1, E2... até E5 → tela pisca
- Pressionar + ou - para alternar entre Celsius (°C) e Fahrenheit (°F)

RESTAURAR CONFIGURAÇÕES DE FÁBRICA:
- Com máquina desligada, pressionar e segurar por 3 segundos → exibe E1
- Pressionar e segurar os botões + e - ao mesmo tempo por 3 segundos até display mostrar conclusão
- ATENÇÃO: exceto configurações E5, outras são apenas para manutenção do fabricante

TEMPERATURAS RECOMENDADAS POR ALIMENTO:
- Bebidas: 5°C
- Frutas: 5~8°C
- Verduras: 3~10°C
- Comida preparada: 4°C
- Vinho: 10°C
- Gelados: -10°C
- Carne: -18°C

LIMPEZA:
- Desconectar o plugue antes de limpar
- Retirar sujeira e escorrer água pelo orifício de drenagem
- Limpar superfícies internas e externas com pano macio úmido
- Secar após limpar
- Não usar limpador abrasivo

DESCONGELAR:
- Desligar a máquina e retirar o cabo
- Retirar itens guardados
- Abrir a tampa e aguardar o gelo derreter
- Remover o plugue da geladeira, drenar a água pelo orifício de drenagem
- Secar com pano macio

ARMAZENAMENTO (quando não for usar por longo período):
- Desligar e desconectar da tomada
- Retirar os itens
- Limpar a água com pano macio
- Colocar em local seco e ventilado
- Abrir um pouco a tampa para evitar odores

ERROS E SOLUÇÕES:
F1 - Proteção de baixa tensão:
- Código de proteção de baixa tensão
- Desligar o interruptor de proteção
- Temperatura da bateria: H (alta), M (média), L (baixa)

F2 - Proteção contra sobrecarga do ventilador:
- Desligar e aguardar 5 minutos antes de ligar novamente
- Se persistir: entrar em contato com o pós-venda

F3 - Compressor com proteção frequente:
- Desligar e aguardar 5 minutos antes de ligar novamente
- Se persistir: entrar em contato com o pós-venda

F4 - Velocidade do compressor muito baixa ou carga muito grande:
- Desligar a máquina e aguardar 5 minutos
- Ligar novamente
- Se persistir: entrar em contato com o pós-venda

F5 - Temperatura alta no módulo compressor:
- Colocar o refrigerador em local ventilado
- Desligar e deixar descansar por 5 minutos
- Ligar novamente
- Se persistir: entrar em contato com o pós-venda

F6 - Controlador não consegue verificar os parâmetros:
- Desligar a energia e aguardar 5 minutos
- Ligar novamente
- Se persistir: entrar em contato com o pós-venda

F7 ou F8 - Cabeça sensora de temperatura com proteção anormal:
- Entrar em contato com o pessoal de pós-venda

PROBLEMAS COMUNS:
Geladeira não está funcionando:
- Verificar se o botão liga/desliga no painel está ligado
- Verificar se o plugue está em bom contato
- Verificar se o fusível está queimado
- Verificar se a fonte de alimentação está com defeito
- Ligar e desligar frequentemente causa atraso no arranque do compressor

Temperatura da geladeira muito alta:
- Abrir e fechar frequentemente a porta aumenta a temperatura
- Não armazenar grande quantidade de alimentos quentes
- Verificar se a geladeira está fora de uso há muito tempo

Alimentos congelando no refrigerador:
- Configuração de temperatura muito baixa — aumentar a temperatura

Som de água correndo por dentro da caixa:
- Quando a umidade do ar entra em contato com a caixa de baixa temperatura ela se liquefaz e condensa em gotículas — fenômeno NORMAL

Gotas de água ao redor da concha ou rachaduras na porta:
- Condensação natural — fenômeno NORMAL

Compressor soa mais alto ao iniciar:
- Quando arranca, o som fica ligeiramente mais alto — depois estabiliza — NORMAL

PÓS-VENDA E GARANTIA (Geladeira):
- Garantia: 3 meses a partir da data de compra
- Não cobre: danos provocados pelo homem, força maior (terremoto, incêndio), não seguir o manual, desmontagem sem permissão

========================================
PRODUTO 4 - GERADOR DIGITAL 24V
========================================
Modelos: LE-3000i e LE-3000i Pro
Aplicável aos dois modelos

ATENÇÃO CRÍTICA DE SEGURANÇA:
- NUNCA usar em ambientes fechados: gás de exaustão contém monóxido de carbono, pode causar perda de consciência ou morte
- Não usar em ambiente úmido
- Manter combustível a pelo menos 1m de distância
- Não fumar durante o reabastecimento
- Parar o motor antes de reabastecer
- Não derramar combustível ao reabastecer
- Gerador NÃO vem com óleo da fábrica: NUNCA ligar sem colocar óleo primeiro
- Não colocar junto com outros itens ao transportar (vazamento de óleo pode danificar o motor)
- Manter orifícios de ventilação limpos e livres de detritos, lama e água

COMPONENTES PRINCIPAIS:
- Alça de transporte
- Tampa do tanque de combustível
- Painel de controle
- Persianas
- Coletor de faíscas

PAINEL DE CONTROLE:
- Troca de óleo
- Luz indicadora de óleo
- Indicador de status
- Combinação de interruptores (Ligar / Desligar / Automático)
- Conexão de fio negativo
- Conexão de fio positivo
- IMPORTANTE: não conectar os polos positivo e negativo ao contrário!

VERSÃO BLUETOOTH:
- Combinação de interruptores
- Conexão de fio negativo e positivo
- Visualização LED

ESPECIFICAÇÕES TÉCNICAS:
- Tensão nominal DC: 28V (±1V, ajustável conforme necessidade do cliente)
- Potência de saída: até 1.800W (≤1.800W)
- Combustível: gasolina sem chumbo
- Capacidade do tanque: 4L
- Óleo do motor: SJ10W-40 (padrão API tipo SE ou superior)
- Capacidade de óleo: 0,4L
- Tipo de motor: monocilíndrico, 4 tempos, arrefecimento por ar forçado, válvula suspensa
- Altitude máxima de operação: conforme certificado
- Temperatura ambiente máxima: conforme certificado

COMBUSTÍVEL:
- Usar APENAS gasolina sem chumbo
- Gasolina com chumbo danifica seriamente as partes internas do motor
- Capacidade do tanque: 4L — encher até a linha vermelha do indicador de nível
- Não encher demais — o óleo transbordará quando o tanque esquentar
- Após reabastecer: fechar bem a tampa e limpar resíduos de gasolina com pano macio

ÓLEO DO MOTOR:
- Óleo recomendado: SJ10W-40
- Grau recomendado: padrão API tipo SE ou superior
- Capacidade: 0,4L
- Gerador NÃO vem com óleo — adicionar antes do primeiro uso
- Para adicionar: colocar em superfície nivelada, soltar parafusos, remover tampa externa, abrir tampa de abastecimento, encher até o limite superior
- Em áreas de baixa temperatura no inverno: usar óleo de baixa temperatura

INICIALIZAÇÃO:
- Conectar a bateria
- Verificar se a linha de conexão de saída está solta ou danificada
- Para iniciar imediatamente: pressionar o interruptor para a posição "Ligar"
- Modo automático: máquina inicia automaticamente quando voltagem da bateria cair abaixo de 23V, 24V ou 25V (configurável)
- Voltagem mínima para partida: 17,5V — abaixo disso o gerador não inicia

DESLIGAMENTO:
- Para parar imediatamente: pressionar interruptor para "Desligar"
- No modo automático: para automaticamente quando a potência do gerador for inferior a 800W

CARREGAMENTO DA BATERIA:
- Tensão CC nominal: 28V (±1V)
- Fio vermelho → terminal positivo (+) da bateria
- Fio preto → terminal negativo (-) da bateria
- Ligar o gerador
- NUNCA inverter os polos
- O cabo deve estar firmemente conectado para evitar que solte pela vibração
- Os fios positivo e negativo devem passar pelo fusível
- Durante o carregamento: não fumar, não conectar/desconectar da bateria (faíscas podem inflamar o gás)
- Eletrólito da bateria contém ácido sulfúrico — evitar contato com pele, olhos e roupa

ÂMBITO DE APLICAÇÃO:
- Potência de saída máxima: ≤1.800W
- Tensão nominal de saída DC: 28V (±1V)

CONDIÇÕES ATMOSFÉRICAS PADRÃO DE OPERAÇÃO:
- Temperatura ambiente: 25°C
- Pressão atmosférica: 100kPa
- Umidade relativa: 30%
- A saída diminui em temperaturas, umidade e altitudes acima do padrão

INDICADORES DE STATUS — LUZES DE FALHA:
Luz vermelha pisca 2 vezes: anomalia de curto-circuito
- Remover fios trifásicos do controlador, deixar no ar, ligar novamente
- Se persistir: substituir controlador
- Verificar vazamento entre fios e carcaça do motor e ponte retificadora

Luz vermelha pisca 3 vezes: anormalidade na linha de fase
- Remover fios trifásicos com energia desligada
- Verificar curto-circuito na ponte retificadora
- Limpar manchas superficiais, reteste
- Se persistir: substituir controlador

4 vermelhos 3 verdes: anomalias de inicialização
- Verificar se fusível de 25A está desconectado
- Confirmar se modelos do motor e controlador correspondem
- Verificar se motor emite som mas não gira
- Verificar se rotor gira normalmente

Luz vermelha pisca 5 vezes: sobretensão de inicialização
- Tensão da bateria maior que 31V (valor padrão de proteção de alta tensão)
- Verificar se tensão atual da bateria está muito alta

Luz vermelha pisca 6 vezes: detecção de velocidade
- Motor teoricamente parado — verificar se o motor para
- Se motor funcionando: confirmar se fio de extinção está em contato normal
- Se motor parado: verificar se ponte retificadora corresponde

Luz vermelha pisca 7 vezes: subtensão da bateria
- Bateria completamente descarregada ou danificada
- Verificar se alguma bateria tem voltagem menor que 8V
- Ligar manualmente para carregar a bateria
- Conectar carregador antes de usar

2 vermelhos 1 verde: verificar fiação
- Confirmar se pinos de instalação do fio trifásico estão em contato normal
- Testar ponte retificadora

3 vermelhos 2 verdes: detectando grandes correntes
- Verificar contato dos terminais trifásicos
- Verificar se rotor gira normalmente
- Verificar interrupção no circuito entre fios trifásicos
- Verificar curto-circuito entre linha de fase e carcaça

5 vermelhos 1 verde: detecção de sobretensão na geração
- Medir voltagem da bateria
- Verificar fio do motor de passo
- Verificar cabos do acelerador e motor de passo da porta de ar
- Verificar fio de extinção e chicotes positivo e negativo

6 vermelhos 1 verde: motor não liga normalmente
- Se tempo de funcionamento menor que 3s: mover tampa de alta pressão do carburador
- Se tempo menor que 10s: verificar circuito de óleo, carburador, motor de passo, vela, fio de extinção
- Se maior que 10s: verificar circuito de óleo e limpar carburador

7 vermelhos 1 verde: detecção de subtensão na geração
- Verificar sobrecarga — reiniciar após desligar
- Verificar curto-circuito na linha trifásica
- Verificar cabo de alimentação solto
- Verificar bateria completamente danificada (voltagem menor que 5V = substituir)

Luz do painel apagada: mau contato
- Desconectar fonte, remover 4 parafusos do painel
- Verificar se chicote elétrico do controlador está em bom contato
- Verificar se entrada de energia está normal

3 vermelhos 4 verdes: anormalidade na comunicação interna (versão Bluetooth)
- Controle remoto pode iniciar e parar mas app não consegue
- Desligar por 10 segundos e ligar novamente
- Se persistir: substituir controlador

Luz do óleo sempre acesa / 3 vermelhos 3 verdes: óleo insuficiente
- Adicionar óleo do motor
- Em baixas temperaturas: usar óleo de baixa temperatura

3 vermelhos 5 verdes: alarme de vazamento de gasolina (versão Bluetooth)
- Verificar se recipiente de vazamento de óleo está vazando
- Verificar vazamentos no carburador

INDICADORES DE STATUS — LUZES NORMAIS:
Luz verde piscando normal: interruptor em ignição desligada ou posição manual
Luz verde piscando 3 vezes: modo automático — partida e parada automáticas
Luz verde piscando 2 vezes: condições de parada automática atendidas
1 vermelho 2 verdes: modo manual
Luz verde piscando rapidamente: estágio de aprendizagem do controle remoto
Luz verde sempre acesa: status de conexão Bluetooth
Luz vermelha e verde ao mesmo tempo: apagamento remoto (duração 12s)

LUZ INDICADORA DE ÓLEO:
- Quando o óleo cair abaixo da linha de segurança: motor desliga automaticamente e luz acende
- Motor só pode ser ligado novamente após encher o óleo até o nível recomendado
- Se indicador piscar por alguns segundos: capacidade de óleo insuficiente — adicionar óleo e reiniciar

COMBINAÇÃO DE INTERRUPTORES:
1 - Ligar
2 - Desligar
3 - Automático

FUNÇÕES COMUNS:
Conexão Bluetooth: ligar o Bluetooth do telefone e autorizar as permissões
Emparelhamento do controle remoto:
- Alternar interruptor entre parada e início automático 4 vezes
- Quando ver luz verde piscando rapidamente, pressionar botão no controle remoto até motor dar partida
- Soltar e pressionar novamente para desligar — emparelhamento feito
- Se falhar: substituir controle remoto e repetir

Modo puxar:
- Após girar interruptor para posição inicial e pressionar controle remoto, luzes ficam 1 vermelho 2 verdes
- Consertar motor e puxar a trava com força para fazer girar

INTERFACE DO APLICATIVO (versão Bluetooth):
- Painel de instrumentos de saída de tensão
- Velocidade atual
- Exibição de potência
- Botão de marcha automática
- Botão Iniciar/Parar
- Configurações de parâmetros
- Posição de autoextinção
- Regulação de tensão de auto-partida: 23V, 24V ou 25V
- Ajuste do tempo de atraso de partida automática
- 8 marchas configuráveis
- Início e parada programados
- Modo de trabalho
- Desligar controle remoto
- Ativação do tanque de combustível auxiliar

MANUTENÇÃO — CRONOGRAMA:
Sempre (antes de cada uso):
- Verificar nível de combustível no tanque
- Verificar nível de óleo do motor
- Verificar se há vazamentos de óleo

Uma vez ao mês ou 20 horas de utilização:
- Verificar e adicionar óleo se necessário
- Examinar e limpar filtro de ar

A cada 3 meses ou 50 horas:
- Substituir óleo do motor
- Substituir óleo de engrenagem (se existir)
- Limpar filtro de ar
- Limpar vela de ignição

100 horas de utilização:
- Verificar e ajustar velocidade de ralenti
- Verificar e ajustar folga da válvula
- Limpar depósito de combustível e filtro
- Verificar tubo de combustível (substituir a cada 2 anos se necessário)
- Remover depósitos de carvão do cabeçote e pistão (a cada 125h para deslocamento menor que 225cc)

OBSERVAÇÃO: Se trabalhar frequentemente em altas temperaturas ou cargas elevadas, trocar óleo a cada 25 horas. Em ambientes poeirentos, limpar filtro de ar a cada 10 horas.

SUBSTITUIÇÃO DO ÓLEO:
1. Ligar por alguns minutos para aquecer o óleo
2. Desligar o motor
3. Remover parafusos e tampa externa
4. Retirar tampa do óleo do motor
5. Inclinar o gerador e verter o óleo em depósito adequado
6. Voltar à posição horizontal
7. Reabastecer até a posição adequada com SJ10W-40 (0,4L)
8. Não inclinar ao adicionar óleo para não adicionar em excesso
9. Limpar a tampa, apertar a vareta, fechar a porta e apertar os parafusos

INSPEÇÃO DA VELA DE IGNIÇÃO:
1. Retirar tampa decorativa e tampa da vela
2. Inserir chave de fendas na luva, girar no sentido anti-horário e retirar a vela
3. Verificar desbotamento e remover depósitos de carvão
4. Verificar modelo e folga da vela
5. Apertar com torque de 12,5 N.m (ou 1/4 a 1/2 volta após sentir que está apertada)

FILTRO DE AR (limpeza):
1. Retirar parafusos e tampa exterior
2. Retirar parafuso e tampa do filtro de ar
3. Remover elemento filtrante de espuma
4. Limpar com solvente e secar
5. Adicionar óleo de motor ao elemento e espremer o excesso
6. Não torcer com força
7. Reinstalar garantindo contato próximo com o filtro
8. Não ligar sem o filtro de ar instalado

FILTRO DE COMBUSTÍVEL (limpeza):
1. Remover tampa do depósito e o filtro
2. Limpar com gasolina
3. Secar e reinstalar
4. Reinstalar a tampa

AJUSTE DO CARBURADOR:
- Deve ser realizado por revendedor com conhecimento profissional
- Não realizar sem ferramentas e equipamentos adequados

SOLUÇÃO DE PROBLEMAS — MOTOR NÃO ARRANCA:
1. Sem gasolina na câmara:
   - Não há combustível no depósito → reabastecer
   - Filtro de combustível entupido → limpar filtro
   - Carburador entupido → limpar carburador
2. Sistema de óleo insuficiente:
   - Nível de óleo baixo → adicionar óleo do motor
3. Sistema elétrico:
   - Vela com depósitos de carvão ou umidade → limpar e secar
   - Problemas no sistema de ignição → contatar fabricante

ARMAZENAMENTO DO GERADOR:
Dentro de 1 mês: nenhuma preparação necessária
1 a 2 meses: drenar gasolina original e adicionar gasolina nova
2 meses a 1 ano: drenar gasolina, drenar gasolina do copo do carburador, drenar copo de sedimentação
Mais de 1 ano: tudo acima + drenar gasolina internamente e adicionar nova antes de usar

PARA REINICIALIZAR APÓS ARMAZENAMENTO:
- Desapertar parafuso de drenagem do óleo do carburador
- Colocar combustível do carburador em depósito especial
- Apertar o parafuso de drenagem
- Após retirar do depósito, colocar gasolina original em recipiente adequado e adicionar gasolina nova antes de começar

PÓS-VENDA E GARANTIA (Gerador):
- Seguir rigorosamente o manual de instalação
- Instalação incorreta: responsabilidade do usuário
- Transformações não autorizadas: responsabilidade do usuário
- Substituição por peças não originais pode causar danos e problemas de segurança
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
