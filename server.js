const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1WWGc7tcK4Y6QJnScCv_TtU5GBk3qYPzmj4APhXAdibw';
const DRIVE_FOLDER_ID = '14FD9T-XyxS9-9r-03si0Amrswcn_pzBR';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'estiloar-admin-2025';

// Índice de pastas em memória
let indiceDrive = [];
let ultimaAtualizacao = null;

// Mapeamento de modelos para marcas
const MODELOS_MARCAS = {
  // Hyundai
  'hr': 'hyundai', 'hd': 'hyundai', 'hr 160': 'hyundai',
  // Scania
  'r450': 'scania', 'r500': 'scania', 's500': 'scania', 'p360': 'scania', 'g420': 'scania',
  // Volvo
  'fh': 'volvo', 'fm': 'volvo', 'fmx': 'volvo', 'vm': 'volvo',
  // Mercedes
  'actros': 'mercedes', 'axor': 'mercedes', 'atego': 'mercedes', 'accelo': 'mercedes',
  // Iveco
  'tector': 'iveco', 'stralis': 'iveco', 'cursor': 'iveco',
  // MAN
  'tgx': 'man', 'tgs': 'man', 'tgm': 'man',
  // Ford
  'cargo': 'ford', 'f-max': 'ford',
  // DAF
  'xf': 'daf', 'cf': 'daf',
  // Volkswagen
  'constellation': 'volkswagen', 'delivery': 'volkswagen', 'worker': 'volkswagen',
  // Fiat
  'ducato': 'fiat',
};

// Busca token de acesso ao Google Drive
async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
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

// Busca subpastas de uma pasta
async function buscarSubpastas(token, pastaId) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${pastaId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&pageSize=1000`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.files || [];
}

// Constrói índice completo de todas as pastas (3 níveis)
async function construirIndice() {
  console.log('Iniciando construção do índice...');
  const token = await getAccessToken();
  const novoIndice = [];

  // Nível 1: Marcas
  const marcas = await buscarSubpastas(token, DRIVE_FOLDER_ID);
  console.log(`Encontradas ${marcas.length} marcas`);

  for (const marca of marcas) {
    // Nível 2: Modelos dentro de cada marca
    const modelos = await buscarSubpastas(token, marca.id);
    console.log(`Marca ${marca.name}: ${modelos.length} modelos`);

    for (const modelo of modelos) {
      novoIndice.push({
        marca: marca.name.toLowerCase(),
        marcaNome: marca.name,
        modelo: modelo.name.toLowerCase(),
        modeloNome: modelo.name,
        id: modelo.id,
        link: `https://drive.google.com/drive/folders/${modelo.id}`
      });
    }

    // Se não tiver subpastas, adiciona a própria marca
    if (modelos.length === 0) {
      novoIndice.push({
        marca: marca.name.toLowerCase(),
        marcaNome: marca.name,
        modelo: marca.name.toLowerCase(),
        modeloNome: marca.name,
        id: marca.id,
        link: `https://drive.google.com/drive/folders/${marca.id}`
      });
    }
  }

  indiceDrive = novoIndice;
  ultimaAtualizacao = new Date();
  console.log(`Índice construído com ${novoIndice.length} pastas`);
  return novoIndice.length;
}

// Busca no índice
function buscarNoIndice(query) {
  if (indiceDrive.length === 0) return null;

  const q = query.toLowerCase();

  // Verifica se é um modelo conhecido e pega a marca
  let marcaBusca = '';
  for (const [modelo, marca] of Object.entries(MODELOS_MARCAS)) {
    if (q.includes(modelo)) {
      marcaBusca = marca;
      break;
    }
  }

  // Filtra por marca e/ou modelo — só retorna se tiver match real
  const resultados = indiceDrive.filter(item => {
    // Se achou a marca pelo mapeamento, filtra só por essa marca
    if (marcaBusca) {
      return item.marca.includes(marcaBusca);
    }
    // Senão, busca palavra exata na marca ou modelo
    const palavras = q.split(' ').filter(p => p.length > 2);
    return palavras.some(p =>
      item.marca.includes(p) || item.modelo.includes(p)
    );
  });

  // Só retorna se tiver match real — nunca retorna aleatório
  return resultados.length > 0 ? resultados : null;
}

// Busca dados da planilha
async function buscarDadosPlanilha() {
  try {
    const abas = ['Ar-Condicionado', 'Geladeira Port%C3%A1til', 'Gerador Digital 24V', 'Promo%C3%A7%C3%B5es Ativas', 'Formas de Pagamento'];
    let dados = '';
    for (const aba of abas) {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${aba}`;
      const response = await fetch(url);
      if (response.ok) {
        const texto = await response.text();
        dados += `\n=== ${decodeURIComponent(aba)} ===\n${texto}\n`;
      }
    }
    return dados;
  } catch (err) {
    console.error('Erro planilha:', err);
    return '';
  }
}

// Rota admin para atualizar índice
app.get('/admin/atualizar-indice', async (req, res) => {
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    const total = await construirIndice();
    res.json({
      sucesso: true,
      mensagem: `Índice atualizado com sucesso!`,
      totalPastas: total,
      atualizadoEm: ultimaAtualizacao
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para ver status do índice
app.get('/admin/status', async (req, res) => {
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  res.json({
    totalPastas: indiceDrive.length,
    ultimaAtualizacao,
    amostra: indiceDrive.slice(0, 5)
  });
});

const MANUAL_CONTEXT = `
Você é o Pedro, assistente técnico da Estilo AR — empresa brasileira que distribui equipamentos de qualidade para veículos e uso geral.

Você é um ser humano trabalhando no suporte da Estilo AR. Nunca diga que é uma IA, robô ou assistente virtual. Se perguntarem se você é humano ou robô, diga que é o Pedro, do time de suporte da Estilo AR.

SEU JEITO DE SER:
- Simpático, acolhedor e paciente como um bom atendente brasileiro
- Fala de forma natural e coloquial mas profissional
- Usa "você", "tá", "beleza", "ótimo", "claro", "pode deixar"
- Demonstra empatia antes de dar a solução quando alguém tem um problema
- Faz perguntas para entender melhor quando necessário
- Quando resolver um problema celebra: "Que ótimo! Fico feliz que deu certo!"
- Se a pergunta não for sobre os produtos, responde de forma simpática e redireciona
- Usa emojis com moderação
- Para problemas graves, sugere ligar para o suporte: (34) 3293-8000
- Sempre responde em português brasileiro

EMPRESA:
- Nome: Estilo AR
- Site: www.estiloar.com.br
- Telefone: (34) 3293-8000
- Horário: Segunda a sexta, 08h às 18h
- Endereço: Av. Engenheiro Diniz, 848 - Martins, Uberlândia - MG

REGRAS IMPORTANTES:
- NUNCA invente preços ou valores — use APENAS os dados da planilha fornecida
- NUNCA invente depoimentos, avaliações ou comentários de clientes
- NUNCA mencione preços ou informações de outras marcas ou concorrentes
- NUNCA acesse informações de sites externos ou outras fontes
- Sobre depoimentos e instalações: responda APENAS com os links das pastas fornecidos
- Se não houver links disponíveis diga: "No momento não encontrei. Ligue para (34) 3293-8000."
- Se não souber responder algo, sugira ligar para (34) 3293-8000
- Responda APENAS com base nas informações do manual e da planilha fornecida

PRODUTOS: Ar-Condicionado 100% Elétrico, Geladeira Portátil e Gerador Digital 24V.

PRODUTO 1 - AR-CONDICIONADO 100% ELÉTRICO:
Modelos: 24V (COD. 740.240 EA) e 12V (COD. 740.241 EA)
Garantia: 3 meses. Guardar embalagem por 30 dias.
Modos: TURBO (máximo), AUTOMÁTICO (regula sozinho), ECO (economiza bateria), VENTILAÇÃO (só ventila)
Temperatura ajustável: 5°C a 32°C
Proteção baixa tensão: padrão 21,5V (24V) / 10,5V (12V). Código LU = bateria baixa.
12V: 7.000 BTUs, bateria mín 150Ah, alternador 90A
24V: 7.750 BTUs, bateria mín 100Ah, alternador 70A
Erros: E2=dissipação, E3=bloqueio, E4=baixa tensão, E6=ventilador, E7=fase compressor, E8=temperatura, E9/PER=pressão, OPE=sensor aberto, Shr=sensor curto, AC=resfriamento, CS=congelamento, LU=baixa tensão
Ar não gela: verificar pressão (baixa 0,2-0,4mpa / alta 10-15mpa).
Instalação: teto solar, borrachão vedação, 4 porcas M10, fio vermelho=positivo, preto=negativo.
Manutenção: a cada 3 meses verificar conexões. Não instalar em tetos maiores que 30 graus.

PRODUTO 2 - GELADEIRA PORTÁTIL:
Modelos: 35L, 45L, 55L
Tensão: DC 12V/24V ou AC 100-240V
Temperatura: -20°C a +20°C | Potência: 60W
Proteção bateria: Baixo/Médio/Alto
Modos: HH (resfriamento rápido) e ECO (economia)
Erros: F1=baixa tensão, F2=ventilador, F3=compressor, F4=velocidade baixa, F5=temperatura alta, F6=controlador, F7/F8=sensor
Garantia: 3 meses.

PRODUTO 3 - GERADOR DIGITAL 24V:
Modelos: LE-3000i e LE-3000i Pro
Tensão: 28V DC | Potência: até 1.800W
Combustível: gasolina sem chumbo (4L) | Óleo: SJ10W-40 (0,4L)
NUNCA usar em ambientes fechados.
NUNCA ligar sem colocar óleo primeiro.
Tensão mínima para partida: 17,5V
Garantia: 3 meses.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages inválidas' });
  }

  try {
    const ultimaMensagem = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Verifica se é pergunta sobre depoimentos/instalações
    const palavrasDepoimento = ['depoimento', 'instalação', 'instalacao', 'cliente', 'referencia', 'referência', 'foto', 'video', 'vídeo', 'quem instalou', 'já instalou', 'ja instalou'];
    const buscaDrive = palavrasDepoimento.some(p => ultimaMensagem.includes(p)) ||
      Object.keys(MODELOS_MARCAS).some(m => ultimaMensagem.includes(m)) ||
      ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'volkswagen', 'hyundai', 'fiat', 'vw'].some(m => ultimaMensagem.includes(m));

    let respostaDrive = null;
    if (buscaDrive) {
      // Se índice vazio, tenta construir
      if (indiceDrive.length === 0) {
        try {
          await construirIndice();
        } catch (err) {
          console.error('Erro ao construir índice:', err);
        }
      }

      const resultados = buscarNoIndice(ultimaMensagem);
      if (resultados && resultados.length > 0) {
        const linksFormatados = resultados.map(r =>
          `📁 **${r.marcaNome} — ${r.modeloNome}**: ${r.link}`
        ).join('\n');
        respostaDrive = `Encontrei ${resultados.length} pasta(s) no Drive:\n\n${linksFormatados}\n\nQualquer outra dúvida é só chamar! 😊`;
      } else {
        respostaDrive = `Não encontrei pastas para essa busca no momento. Para mais informações ligue para **(34) 3293-8000**. 😊`;
      }
    }

    // Se encontrou no Drive, retorna direto sem chamar o modelo
    if (respostaDrive) {
      return res.json({ reply: respostaDrive });
    }

    // Busca dados da planilha
    const dadosPlanilha = await buscarDadosPlanilha();
    const contextoCompleto = MANUAL_CONTEXT + `
========================================
DADOS ATUALIZADOS DA PLANILHA:
========================================
${dadosPlanilha || 'Planilha indisponível. Se perguntarem sobre preços, sugira ligar para (34) 3293-8000.'}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: contextoCompleto },
          ...messages
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API' });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sem resposta.';
    res.json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Atualiza índice automaticamente a cada 24 horas
setInterval(async () => {
  try {
    await construirIndice();
  } catch (err) {
    console.error('Erro na atualização automática:', err);
  }
}, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Constrói índice ao iniciar
  try {
    await construirIndice();
  } catch (err) {
    console.error('Erro ao construir índice inicial:', err);
  }
});
