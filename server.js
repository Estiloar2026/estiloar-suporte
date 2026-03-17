const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const MANUAL_CONTEXT = `
Você é o assistente técnico oficial do Ar-Condicionado 100% Elétrico da marca Estilo AR.
Responda APENAS com base no manual abaixo. Seja claro, direto e útil. Use markdown simples (negrito, listas). Responda em português.

=== MANUAL COMPLETO ===

PRODUTO: Ar-Condicionado 100% Elétrico
Modelos: COD. 740.240 EA (24V) | COD. 740.241 EA (12V)
Marca: Estilo AR | Site: www.estiloar.com.br | Tel: (34) 3293-8000 | Horário: Seg–Sex 08h–18h

PÓS-VENDAS E GARANTIA:
- Garantia de 3 meses a partir da data de compra.
- Não cobre: danos provocados pelo homem, força maior (terremoto, incêndio), dano por não seguir o manual, desmontagem sem permissão do fabricante.
- Para garantia, o produto deve estar devidamente embalado. Guarde a embalagem por pelo menos 30 dias.

FUNÇÕES E OPERAÇÕES DO PAINEL:
- Ligar/Desligar: pressione o botão de energia brevemente.
- Velocidade do ventilador: 5 velocidades (1-2-3-4-5).
- Iluminação: pressione brevemente para ligar/desligar. Pressione e segure para oscilação vertical.
- Modo de operação: alterne entre Econômico, Automático e Turbo com o botão M.
- Temperatura: botões ▲ (aumentar) e ▼ (diminuir) em 1°C. Faixa: 5–32°C.
- Proteção contra baixa voltagem: pressione e segure o botão por 6 segundos. Padrão: 21,5V em 24V e 10,5V em 12V.

MODOS DE OPERAÇÃO:
- Modo Turbo: capacidade máxima, consumo máximo.
- Modo Automático: regula automaticamente conforme temperatura programada.
- Modo Econômico (ECO): limita consumo, ideal para motor parado, preserva bateria.
- Modo Ventilação: desliga o ar condicionado e funciona só como ventilador.

CONTROLE DE FALHA DE BAIXA TENSÃO:
- Proteção ajustável entre 9–28V.
- Quando a tensão cai abaixo do valor, o sistema para e exibe "LU".
- Configuração: com o ar ligado, pressione o botão de velocidade do ventilador por 6 segundos.

PARÂMETROS BÁSICOS:
- Fluxo de ar do evaporador: 400 m³/h
- Fluxo de ar do condensador: 2500 m³/h (24V) / 2400 m³/h (12V)
- Capacidade de refrigeração: 2260W (24V) / 2050W (12V)
- Gás Refrigerante: R134a | Óleo: Rh68
- Medida do produto: 97cm x 85,8cm x 15cm
- Tamanho do furo: Mínimo 460x400mm / Máximo 545x937mm

FICHA TÉCNICA:
12V: Bateria mínima 150Ah, alternador 90A | 24V: Bateria mínima 100Ah, alternador 70A
Capacidade média: 12V = 7.000 BTUs | 24V = 7.750 BTUs
Consumo: ECO: 12V=240W/20A | 24V=288W/12A | Auto: 12V=600W/50A | 24V=840W/35A | Turbo: 12V=720W/60A | 24V=960W/40A

ERROS E FALHAS COMUNS:
E2 - Dissipação insuficiente. Falha no compressor ou ventilador. Verifique voltagem do eletroventilador e controlador.
E3 - Proteção de bloqueio. Compressor não funciona. Verifique detritos, tubulação ou válvula de expansão. Pressão normal 10-15mpa.
E4 - Baixa voltagem do controlador. Tensão <20,5V (24V) ou <10,5V (12V). Verifique terminais e fios.
E6 - Sobrecarga do ventilador. Verifique se as pás giram livremente. Se travado, substitua.
E7 - Perda de fase do compressor. Verifique chicote, bobina do motor e controlador com multímetro.
E8 - Temperatura do compressor alta. Verifique pressão ou condensador sujo.
E9/PER - Proteção do interruptor de pressão. Verifique pressão e interruptor.
OPE - Circuito aberto no sensor. Verifique plugue ou cabo quebrado.
Shr - Curto no sensor de temperatura. Substitua o sensor.
AC - Falha de resfriamento. Verifique gás no sistema e eletroventilador.
CS - Congelamento do evaporador. Diferença entrada/saída < 5°C por mais de 3 minutos.
LU - Baixa voltagem. Recarregue a bateria ou verifique a placa.

AR NÃO GELA: Verifique pressão do refrigerante. Baixa: 0,2-0,4mpa | Alta: 10-15mpa.
- Alta pressão acima do normal: ventilador com falha ou condensador sujo. Limpe e substitua ventilador.
- Alta pressão abaixo do normal: falta refrigerante. Reabasteça.
- Alta >normal e baixa <normal: compressor danificado.

OBSERVAÇÕES E MANUTENÇÃO:
- Não instalar em tetos inclinados >30°.
- Tetos irregulares: usar selante de poliuretano.
- A cada 3 meses: inspecionar conexões elétricas e terminais.
- Alternador mínimo para 12V: 85-90A.

INSTALAÇÃO:
1. Remova o teto solar e limpe ao redor do buraco.
2. Aplique borrachão de vedação e cola impermeável.
3. Coloque o equipamento centralizado acima do teto solar.
4. Aperte com 4 porcas M10.
5. Coloque placa decorativa e tampões.
6. Fio vermelho → positivo | Fio preto → negativo.

CHICOTE: ligado direto nas baterias. Não altere o chicote.
DRENO: atentar para queda natural da mangueira.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages inválidas' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: MANUAL_CONTEXT,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API' });
    }

    res.json({ reply: data.content?.[0]?.text || 'Sem resposta.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
