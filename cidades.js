// Banco de dados de municípios brasileiros com coordenadas
const CIDADES = [
  // ACRE
  {cidade:"Rio Branco",estado:"AC",lat:-9.9754,lng:-67.8249},{cidade:"Cruzeiro do Sul",estado:"AC",lat:-7.6306,lng:-72.6697},{cidade:"Sena Madureira",estado:"AC",lat:-9.0658,lng:-68.6578},{cidade:"Tarauacá",estado:"AC",lat:-8.1608,lng:-70.7697},
  // ALAGOAS
  {cidade:"Maceió",estado:"AL",lat:-9.6658,lng:-35.7350},{cidade:"Arapiraca",estado:"AL",lat:-9.7522,lng:-36.6611},{cidade:"Palmeira dos Índios",estado:"AL",lat:-9.4081,lng:-36.6303},{cidade:"Penedo",estado:"AL",lat:-10.2908,lng:-36.5839},{cidade:"Delmiro Gouveia",estado:"AL",lat:-9.3897,lng:-37.9989},
  // AMAPÁ
  {cidade:"Macapá",estado:"AP",lat:0.0349,lng:-51.0694},{cidade:"Santana",estado:"AP",lat:-0.0583,lng:-51.1836},{cidade:"Oiapoque",estado:"AP",lat:3.8406,lng:-51.8339},
  // AMAZONAS
  {cidade:"Manaus",estado:"AM",lat:-3.1019,lng:-60.0250},{cidade:"Parintins",estado:"AM",lat:-2.6275,lng:-56.7358},{cidade:"Itacoatiara",estado:"AM",lat:-3.1431,lng:-58.4442},{cidade:"Coari",estado:"AM",lat:-4.0853,lng:-63.1408},{cidade:"Tefé",estado:"AM",lat:-3.3653,lng:-64.7092},{cidade:"Tabatinga",estado:"AM",lat:-4.2553,lng:-69.9383},
  // BAHIA
  {cidade:"Salvador",estado:"BA",lat:-12.9714,lng:-38.5014},{cidade:"Feira de Santana",estado:"BA",lat:-12.2664,lng:-38.9663},{cidade:"Vitória da Conquista",estado:"BA",lat:-14.8661,lng:-40.8444},{cidade:"Camaçari",estado:"BA",lat:-12.6997,lng:-38.3242},{cidade:"Itabuna",estado:"BA",lat:-14.7853,lng:-39.2806},{cidade:"Juazeiro",estado:"BA",lat:-9.4258,lng:-40.5017},{cidade:"Ilhéus",estado:"BA",lat:-14.7886,lng:-39.0492},{cidade:"Jequié",estado:"BA",lat:-13.8564,lng:-40.0836},{cidade:"Teixeira de Freitas",estado:"BA",lat:-17.5386,lng:-39.7419},{cidade:"Barreiras",estado:"BA",lat:-12.1522,lng:-44.9942},{cidade:"Paulo Afonso",estado:"BA",lat:-9.4058,lng:-38.2158},{cidade:"Eunápolis",estado:"BA",lat:-16.3758,lng:-39.5808},{cidade:"Guanambi",estado:"BA",lat:-14.2236,lng:-42.7806},
  // CEARÁ
  {cidade:"Fortaleza",estado:"CE",lat:-3.7172,lng:-38.5433},{cidade:"Caucaia",estado:"CE",lat:-3.7361,lng:-38.6531},{cidade:"Juazeiro do Norte",estado:"CE",lat:-7.2097,lng:-39.3153},{cidade:"Sobral",estado:"CE",lat:-3.6886,lng:-40.3497},{cidade:"Crato",estado:"CE",lat:-7.2342,lng:-39.4092},{cidade:"Iguatu",estado:"CE",lat:-6.3594,lng:-39.2983},{cidade:"Quixadá",estado:"CE",lat:-4.9697,lng:-39.0150},
  // DISTRITO FEDERAL
  {cidade:"Brasília",estado:"DF",lat:-15.7801,lng:-47.9292},{cidade:"Ceilândia",estado:"DF",lat:-15.8139,lng:-48.1119},{cidade:"Taguatinga",estado:"DF",lat:-15.8397,lng:-48.0553},{cidade:"Gama",estado:"DF",lat:-16.0122,lng:-48.0650},
  // ESPÍRITO SANTO
  {cidade:"Vitória",estado:"ES",lat:-20.3155,lng:-40.3128},{cidade:"Vila Velha",estado:"ES",lat:-20.3297,lng:-40.2922},{cidade:"Serra",estado:"ES",lat:-20.1283,lng:-40.3072},{cidade:"Cariacica",estado:"ES",lat:-20.2631,lng:-40.4169},{cidade:"Cachoeiro de Itapemirim",estado:"ES",lat:-20.8489,lng:-41.1131},{cidade:"Linhares",estado:"ES",lat:-19.3911,lng:-40.0642},{cidade:"Colatina",estado:"ES",lat:-19.5389,lng:-40.6308},
  // GOIÁS
  {cidade:"Goiânia",estado:"GO",lat:-16.6869,lng:-49.2648},{cidade:"Aparecida de Goiânia",estado:"GO",lat:-16.8231,lng:-49.2464},{cidade:"Anápolis",estado:"GO",lat:-16.3281,lng:-48.9528},{cidade:"Rio Verde",estado:"GO",lat:-17.7967,lng:-50.9242},{cidade:"Luziânia",estado:"GO",lat:-16.2522,lng:-47.9500},{cidade:"Itumbiara",estado:"GO",lat:-18.4189,lng:-49.2158},{cidade:"Catalão",estado:"GO",lat:-18.1661,lng:-47.9444},{cidade:"Jataí",estado:"GO",lat:-17.8797,lng:-51.7153},{cidade:"Caldas Novas",estado:"GO",lat:-17.7419,lng:-48.6247},
  // MARANHÃO
  {cidade:"São Luís",estado:"MA",lat:-2.5297,lng:-44.3028},{cidade:"Imperatriz",estado:"MA",lat:-5.5253,lng:-47.4922},{cidade:"Timon",estado:"MA",lat:-5.0942,lng:-42.8358},{cidade:"Caxias",estado:"MA",lat:-4.8614,lng:-43.3558},{cidade:"Açailândia",estado:"MA",lat:-4.9481,lng:-47.5003},{cidade:"Bacabal",estado:"MA",lat:-4.2214,lng:-44.7883},{cidade:"Balsas",estado:"MA",lat:-7.5322,lng:-46.0358},
  // MATO GROSSO
  {cidade:"Cuiabá",estado:"MT",lat:-15.5989,lng:-56.0949},{cidade:"Várzea Grande",estado:"MT",lat:-15.6467,lng:-56.1322},{cidade:"Rondonópolis",estado:"MT",lat:-16.4728,lng:-54.6358},{cidade:"Sinop",estado:"MT",lat:-11.8653,lng:-55.5036},{cidade:"Tangará da Serra",estado:"MT",lat:-14.6222,lng:-57.5014},{cidade:"Cáceres",estado:"MT",lat:-16.0758,lng:-57.6814},{cidade:"Sorriso",estado:"MT",lat:-12.5447,lng:-55.7203},{cidade:"Alta Floresta",estado:"MT",lat:-9.8761,lng:-56.0861},
  // MATO GROSSO DO SUL
  {cidade:"Campo Grande",estado:"MS",lat:-20.4697,lng:-54.6201},{cidade:"Dourados",estado:"MS",lat:-22.2211,lng:-54.8056},{cidade:"Três Lagoas",estado:"MS",lat:-20.7514,lng:-51.6783},{cidade:"Corumbá",estado:"MS",lat:-19.0083,lng:-57.6553},{cidade:"Ponta Porã",estado:"MS",lat:-22.5358,lng:-55.7258},{cidade:"Aquidauana",estado:"MS",lat:-20.4706,lng:-55.7864},
  // MINAS GERAIS
  {cidade:"Belo Horizonte",estado:"MG",lat:-19.9167,lng:-43.9345},{cidade:"Uberlândia",estado:"MG",lat:-18.9186,lng:-48.2772},{cidade:"Contagem",estado:"MG",lat:-19.9317,lng:-44.0536},{cidade:"Juiz de Fora",estado:"MG",lat:-21.7642,lng:-43.3503},{cidade:"Betim",estado:"MG",lat:-19.9678,lng:-44.1983},{cidade:"Montes Claros",estado:"MG",lat:-16.7281,lng:-43.8614},{cidade:"Uberaba",estado:"MG",lat:-19.7486,lng:-47.9317},{cidade:"Governador Valadares",estado:"MG",lat:-18.8511,lng:-41.9494},{cidade:"Ipatinga",estado:"MG",lat:-19.4678,lng:-42.5369},{cidade:"Sete Lagoas",estado:"MG",lat:-19.4656,lng:-44.2469},{cidade:"Divinópolis",estado:"MG",lat:-20.1386,lng:-44.8847},{cidade:"Poços de Caldas",estado:"MG",lat:-21.7872,lng:-46.5614},{cidade:"Patos de Minas",estado:"MG",lat:-18.5786,lng:-46.5183},{cidade:"Pouso Alegre",estado:"MG",lat:-22.2297,lng:-45.9358},{cidade:"Teófilo Otoni",estado:"MG",lat:-17.8572,lng:-41.5058},{cidade:"Barbacena",estado:"MG",lat:-21.2258,lng:-43.7736},{cidade:"Varginha",estado:"MG",lat:-21.5514,lng:-45.4308},{cidade:"Ituiutaba",estado:"MG",lat:-18.9667,lng:-49.4647},{cidade:"Lavras",estado:"MG",lat:-21.2458,lng:-44.9997},{cidade:"Araguari",estado:"MG",lat:-18.6483,lng:-48.1883},{cidade:"Muriaé",estado:"MG",lat:-21.1283,lng:-42.3672},{cidade:"Caratinga",estado:"MG",lat:-19.7906,lng:-42.1378},
  // PARÁ
  {cidade:"Belém",estado:"PA",lat:-1.4558,lng:-48.5039},{cidade:"Ananindeua",estado:"PA",lat:-1.3656,lng:-48.3722},{cidade:"Santarém",estado:"PA",lat:-2.4397,lng:-54.7081},{cidade:"Marabá",estado:"PA",lat:-5.3686,lng:-49.1178},{cidade:"Parauapebas",estado:"PA",lat:-6.0686,lng:-49.9019},{cidade:"Castanhal",estado:"PA",lat:-1.2942,lng:-47.9258},{cidade:"Tucuruí",estado:"PA",lat:-3.7658,lng:-49.6703},{cidade:"Altamira",estado:"PA",lat:-3.2033,lng:-52.2061},
  // PARAÍBA
  {cidade:"João Pessoa",estado:"PB",lat:-7.1153,lng:-34.8641},{cidade:"Campina Grande",estado:"PB",lat:-7.2306,lng:-35.8811},{cidade:"Patos",estado:"PB",lat:-7.0236,lng:-37.2803},{cidade:"Sousa",estado:"PB",lat:-6.7572,lng:-38.2297},{cidade:"Cajazeiras",estado:"PB",lat:-6.8914,lng:-38.5597},
  // PARANÁ
  {cidade:"Curitiba",estado:"PR",lat:-25.4284,lng:-49.2733},{cidade:"Londrina",estado:"PR",lat:-23.3045,lng:-51.1696},{cidade:"Maringá",estado:"PR",lat:-23.4273,lng:-51.9375},{cidade:"Ponta Grossa",estado:"PR",lat:-25.0945,lng:-50.1633},{cidade:"Cascavel",estado:"PR",lat:-24.9578,lng:-53.4550},{cidade:"São José dos Pinhais",estado:"PR",lat:-25.5317,lng:-49.2072},{cidade:"Foz do Iguaçu",estado:"PR",lat:-25.5478,lng:-54.5882},{cidade:"Guarapuava",estado:"PR",lat:-25.3908,lng:-51.4628},{cidade:"Paranaguá",estado:"PR",lat:-25.5208,lng:-48.5089},{cidade:"Toledo",estado:"PR",lat:-24.7258,lng:-53.7442},{cidade:"Apucarana",estado:"PR",lat:-23.5508,lng:-51.4608},{cidade:"Umuarama",estado:"PR",lat:-23.7658,lng:-53.3253},{cidade:"Campo Mourão",estado:"PR",lat:-24.0458,lng:-52.3828},{cidade:"Francisco Beltrão",estado:"PR",lat:-26.0811,lng:-53.0542},
  // PERNAMBUCO
  {cidade:"Recife",estado:"PE",lat:-8.0539,lng:-34.8811},{cidade:"Caruaru",estado:"PE",lat:-8.2836,lng:-35.9761},{cidade:"Olinda",estado:"PE",lat:-8.0089,lng:-34.8553},{cidade:"Petrolina",estado:"PE",lat:-9.3978,lng:-40.5003},{cidade:"Jaboatão dos Guararapes",estado:"PE",lat:-8.1133,lng:-35.0125},{cidade:"Garanhuns",estado:"PE",lat:-8.8894,lng:-36.4964},
  // PIAUÍ
  {cidade:"Teresina",estado:"PI",lat:-5.0892,lng:-42.8019},{cidade:"Parnaíba",estado:"PI",lat:-2.9044,lng:-41.7764},{cidade:"Picos",estado:"PI",lat:-7.0772,lng:-41.4669},{cidade:"Floriano",estado:"PI",lat:-6.7669,lng:-43.0236},
  // RIO DE JANEIRO
  {cidade:"Rio de Janeiro",estado:"RJ",lat:-22.9068,lng:-43.1729},{cidade:"São Gonçalo",estado:"RJ",lat:-22.8269,lng:-43.0539},{cidade:"Duque de Caxias",estado:"RJ",lat:-22.7853,lng:-43.3119},{cidade:"Nova Iguaçu",estado:"RJ",lat:-22.7597,lng:-43.4511},{cidade:"Niterói",estado:"RJ",lat:-22.8833,lng:-43.1036},{cidade:"Campos dos Goytacazes",estado:"RJ",lat:-21.7553,lng:-41.3311},{cidade:"Petrópolis",estado:"RJ",lat:-22.5050,lng:-43.1786},{cidade:"Volta Redonda",estado:"RJ",lat:-22.5233,lng:-44.1036},{cidade:"Macaé",estado:"RJ",lat:-22.3708,lng:-41.7869},{cidade:"Cabo Frio",estado:"RJ",lat:-22.8789,lng:-42.0189},{cidade:"Angra dos Reis",estado:"RJ",lat:-23.0067,lng:-44.3183},{cidade:"Resende",estado:"RJ",lat:-22.4703,lng:-44.4503},
  // RIO GRANDE DO NORTE
  {cidade:"Natal",estado:"RN",lat:-5.7945,lng:-35.2110},{cidade:"Mossoró",estado:"RN",lat:-5.1878,lng:-37.3442},{cidade:"Parnamirim",estado:"RN",lat:-5.9147,lng:-35.2639},{cidade:"Caicó",estado:"RN",lat:-6.4578,lng:-37.0972},
  // RIO GRANDE DO SUL
  {cidade:"Porto Alegre",estado:"RS",lat:-30.0346,lng:-51.2177},{cidade:"Caxias do Sul",estado:"RS",lat:-29.1678,lng:-51.1794},{cidade:"Canoas",estado:"RS",lat:-29.9178,lng:-51.1839},{cidade:"Pelotas",estado:"RS",lat:-31.7719,lng:-52.3425},{cidade:"Santa Maria",estado:"RS",lat:-29.6842,lng:-53.8069},{cidade:"Novo Hamburgo",estado:"RS",lat:-29.6783,lng:-51.1303},{cidade:"São Leopoldo",estado:"RS",lat:-29.7594,lng:-51.1489},{cidade:"Rio Grande",estado:"RS",lat:-32.0350,lng:-52.0986},{cidade:"Passo Fundo",estado:"RS",lat:-28.2625,lng:-52.4069},{cidade:"Uruguaiana",estado:"RS",lat:-29.7547,lng:-57.0883},{cidade:"Bagé",estado:"RS",lat:-31.3308,lng:-54.1061},{cidade:"Bento Gonçalves",estado:"RS",lat:-29.1728,lng:-51.5183},{cidade:"Erechim",estado:"RS",lat:-27.6339,lng:-52.2742},{cidade:"Portão",estado:"RS",lat:-29.6858,lng:-51.2444},{cidade:"Lajeado",estado:"RS",lat:-29.4667,lng:-51.9658},{cidade:"Ijuí",estado:"RS",lat:-28.3878,lng:-53.9158},
  // RONDÔNIA
  {cidade:"Porto Velho",estado:"RO",lat:-8.7619,lng:-63.9039},{cidade:"Ji-Paraná",estado:"RO",lat:-10.8839,lng:-61.9458},{cidade:"Ariquemes",estado:"RO",lat:-9.9117,lng:-63.0378},{cidade:"Vilhena",estado:"RO",lat:-12.7406,lng:-60.1458},
  // RORAIMA
  {cidade:"Boa Vista",estado:"RR",lat:2.8197,lng:-60.6733},
  // SANTA CATARINA
  {cidade:"Joinville",estado:"SC",lat:-26.3044,lng:-48.8456},{cidade:"Florianópolis",estado:"SC",lat:-27.5954,lng:-48.5480},{cidade:"Blumenau",estado:"SC",lat:-26.9194,lng:-49.0661},{cidade:"São José",estado:"SC",lat:-27.5939,lng:-48.6358},{cidade:"Chapecó",estado:"SC",lat:-27.1006,lng:-52.6156},{cidade:"Criciúma",estado:"SC",lat:-28.6775,lng:-49.3697},{cidade:"Itajaí",estado:"SC",lat:-26.9078,lng:-48.6619},{cidade:"Jaraguá do Sul",estado:"SC",lat:-26.4858,lng:-49.0706},{cidade:"Lages",estado:"SC",lat:-27.8158,lng:-50.3261},{cidade:"Balneário Camboriú",estado:"SC",lat:-26.9906,lng:-48.6347},{cidade:"Tubarão",estado:"SC",lat:-28.4678,lng:-49.0092},{cidade:"Concórdia",estado:"SC",lat:-27.2328,lng:-52.0278},
  // SÃO PAULO
  {cidade:"São Paulo",estado:"SP",lat:-23.5505,lng:-46.6333},{cidade:"Guarulhos",estado:"SP",lat:-23.4628,lng:-46.5333},{cidade:"Campinas",estado:"SP",lat:-22.9056,lng:-47.0608},{cidade:"São Bernardo do Campo",estado:"SP",lat:-23.6939,lng:-46.5650},{cidade:"Santo André",estado:"SP",lat:-23.6639,lng:-46.5383},{cidade:"Ribeirão Preto",estado:"SP",lat:-21.1775,lng:-47.8103},{cidade:"Osasco",estado:"SP",lat:-23.5325,lng:-46.7919},{cidade:"Sorocaba",estado:"SP",lat:-23.5015,lng:-47.4526},{cidade:"São José dos Campos",estado:"SP",lat:-23.1794,lng:-45.8869},{cidade:"Mogi das Cruzes",estado:"SP",lat:-23.5228,lng:-46.1869},{cidade:"Jundiaí",estado:"SP",lat:-23.1864,lng:-46.8978},{cidade:"Piracicaba",estado:"SP",lat:-22.7253,lng:-47.6492},{cidade:"Bauru",estado:"SP",lat:-22.3147,lng:-49.0619},{cidade:"Santos",estado:"SP",lat:-23.9608,lng:-46.3336},{cidade:"São José do Rio Preto",estado:"SP",lat:-20.8197,lng:-49.3797},{cidade:"Limeira",estado:"SP",lat:-22.5639,lng:-47.4019},{cidade:"Franca",estado:"SP",lat:-20.5386,lng:-47.4008},{cidade:"Taubaté",estado:"SP",lat:-23.0261,lng:-45.5556},{cidade:"Americana",estado:"SP",lat:-22.7386,lng:-47.3328},{cidade:"Araraquara",estado:"SP",lat:-21.7942,lng:-48.1758},{cidade:"Marília",estado:"SP",lat:-22.2139,lng:-49.9458},{cidade:"Presidente Prudente",estado:"SP",lat:-22.1256,lng:-51.3886},{cidade:"Indaiatuba",estado:"SP",lat:-23.0908,lng:-47.2192},{cidade:"Sumaré",estado:"SP",lat:-22.8206,lng:-47.2669},{cidade:"São Carlos",estado:"SP",lat:-21.9736,lng:-47.8908},{cidade:"Rio Claro",estado:"SP",lat:-22.4156,lng:-47.5614},{cidade:"Barueri",estado:"SP",lat:-23.5028,lng:-46.8783},{cidade:"Jacareí",estado:"SP",lat:-23.2978,lng:-45.9658},{cidade:"Botucatu",estado:"SP",lat:-22.8856,lng:-48.4447},{cidade:"Araçatuba",estado:"SP",lat:-21.2089,lng:-50.4428},{cidade:"Ourinhos",estado:"SP",lat:-22.9789,lng:-49.8708},{cidade:"Catanduva",estado:"SP",lat:-21.1378,lng:-48.9728},
  // SERGIPE
  {cidade:"Aracaju",estado:"SE",lat:-10.9472,lng:-37.0731},{cidade:"Lagarto",estado:"SE",lat:-10.9139,lng:-37.6472},{cidade:"Itabaiana",estado:"SE",lat:-10.6853,lng:-37.4253},
  // TOCANTINS
  {cidade:"Palmas",estado:"TO",lat:-10.2491,lng:-48.3243},{cidade:"Araguaína",estado:"TO",lat:-7.1919,lng:-48.2044},{cidade:"Gurupi",estado:"TO",lat:-11.7283,lng:-49.0664},{cidade:"Porto Nacional",estado:"TO",lat:-10.7083,lng:-48.4169},
];

function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function buscarCidade(nome) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const q = norm(nome);
  return CIDADES.find(c => norm(c.cidade) === q) ||
         CIDADES.find(c => norm(c.cidade).includes(q) || q.includes(norm(c.cidade)));
}

function cidadesMaisProximas(lat, lng, lista, n = 2) {
  return lista
    .map(p => ({ ...p, dist: calcularDistancia(lat, lng, p.lat, p.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

module.exports = { CIDADES, calcularDistancia, buscarCidade, cidadesMaisProximas };
