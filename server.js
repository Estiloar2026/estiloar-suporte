const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1WWGc7tcK4Y6QJnScCv_TtU5GBk3qYPzmj4APhXAdibw';
const DRIVE_FOLDER_ID = '14FD9T-XyxS9-9r-03si0Amrswcn_pzBR';

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

// Busca subpastas do Drive
async function buscarPastasDrive(query) {
  try {
    const token = await getAccessToken();

    // Busca todas as pastas dentro da pasta principal
    const url = `https://www.googleapis.com/drive/v3/files?q='${DRIVE_FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&pageSize=100`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    const pastas = data.files || [];

    if (pastas.length === 0) return null;

    // Filtra pastas relevantes para a query
    const queryLower = query.toLowerCase();
    const pastasFiltradas = pastas.filter(p =>
      p.name.toLowerCase().includes(queryLower)
    );

    const listagem = pastasFiltradas.length > 0 ? pastasFiltradas : pastas;

    return listagem.map(p => ({
      nome: p.name,
      link: `https://drive.google.com/drive/folders/${p.id}`
    }));

  } catch (err) {
    console.error('Erro Drive:', err);
    return null;
  }
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
- NUNCA mencione preços, informações ou comparações de outras marcas ou concorrentes
- NUNCA acesse ou mencione informações de sites externos, internet ou outras fontes
- Se perguntarem sobre preços de outras marcas, diga que só trabalha com os produtos da Estilo AR
- Se perguntarem sobre concorrentes, redirecione para os benefícios dos produtos Estilo AR
- NUNCA invente informações que não estão no manual ou na planilha
- Se não souber responder algo, diga honestamente e sugira ligar para (34) 3293-8000
- Responda APENAS com base nas informações do manual e da planilha fornecida
- Quando receber links de pastas do Drive, apresente-os de forma organizada e amigável

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
    const palavrasDepoimento = ['depoimento', 'instalação', 'instalacao', 'cliente', 'foto', 'video', 'vídeo', 'scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford', 'caminhao', 'caminhão'];
    const buscaDrive = palavrasDepoimento.some(p => ultimaMensagem.includes(p));

    let dadosDrive = '';
    if (buscaDrive) {
      // Extrai a marca/modelo da mensagem
      const marcas = ['scania', 'volvo', 'mercedes', 'iveco', 'man', 'daf', 'ford'];
      const marcaEncontrada = marcas.find(m => ultimaMensagem.includes(m)) || '';
      const pastas = await buscarPastasDrive(marcaEncontrada);

      if (pastas && pastas.length > 0) {
        dadosDrive = '\n\nPASTAS ENCONTRADAS NO DRIVE (apresente esses links ao usuário de forma organizada):\n';
        pastas.forEach(p => {
          dadosDrive += `- ${p.nome}: ${p.link}\n`;
        });
      } else {
        dadosDrive = '\n\nNenhuma pasta encontrada no Drive para essa busca.';
      }
    }

    // Busca dados da planilha
    const dadosPlanilha = await buscarDadosPlanilha();

    const contextoCompleto = MANUAL_CONTEXT + `

========================================
DADOS ATUALIZADOS DA PLANILHA (preços, promoções e formas de pagamento):
========================================
${dadosPlanilha || 'Planilha temporariamente indisponível. Se perguntarem sobre preços, sugira ligar para (34) 3293-8000.'}
${dadosDrive}
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
      console.error('Groq error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API' });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sem resposta.';
    res.json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
