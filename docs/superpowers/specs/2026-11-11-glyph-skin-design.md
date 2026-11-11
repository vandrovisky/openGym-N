# openGym-N: skin glyph para o APK pessoal

Data: 2026-11-11. Estado: implementado no branch `glyph-skin`, APK ainda não gerado (falta JDK e Android SDK nesta máquina).

## Intenção

Este fork gera um APK pessoal do openGym para um Nothing Phone 2. O app deve parecer um app da
Nothing: preto, pontos brancos, um único vermelho, números em matriz de pontos. A referência visual
é o repositório `vandrovisky/glyph-rice` (fontes, paleta e regras de uso tiradas de
`config/quickshell/glyph/Theme.qml` e `components/Num.qml`).

É só uma troca de aparência. Telas, navegação, funções, dados e sincronização ficam idênticos ao
openGym original.

## Objetivos

- Dados de treino, tabelas e métricas no visual glyph: números de destaque em dot, mesmas fontes e
  cores do glyph-rice.
- Instalar ao lado do app oficial, com nome e ícone próprios.
- Continuar fácil de atualizar a partir do openGym original.

## Fora do escopo

- iPhone, Apple Watch, Wear OS, Garmin, widgets, site, API, MCP, deploy web.
- LEDs Glyph da traseira do telefone.
- Publicação em loja. O APK é para uso pessoal.
- Reorganizar telas ou mudar o que cada tela mostra.

## O que seria fracasso mesmo funcionando

- Qualquer mudança em lógica de treino, progressão, 1RM, histórico ou sync.
- Números menos legíveis no meio de uma série do que no app original.
- Vermelho espalhado pela tela. Ele perde o sentido se não for raro.
- Uma skin tão entranhada no código que cada atualização do original vira conflito.

## Decisões do usuário

- Só reskin, tudo o mais se mantém.
- Variante B do mockup: Doto apenas nos destaques, tabela de séries compacta em Space Mono.
- Tema glyph escuro como padrão, tema glyph claro como opção. Seletor de cor de destaque e temas
  sazonais (Natal, Halloween) desligados.
- Nome: `openGym-N`, com "open" em branco e "Gym" em vermelho.
- Ícone: um halter desenhado em matriz de pontos.
- O fork pode ficar público (AGPL atendida).

## Linguagem visual

### Paleta

| Papel | Escuro | Claro |
|---|---|---|
| fundo | `#000000` | `#E9E9E9` |
| barras, painéis | `#0E0E0E` | `#FFFFFF` |
| cartões, desligado | `#1A1A1A` | `#F1F1F1` |
| linhas, pontos apagados | `#2A2A2A` | `#D9D9D9` |
| inativo | `#4A4A4A` | `#B8B8B8` |
| rótulos, secundário | `#8C8C8C` | `#696969` |
| texto, ligado | `#F2F2F2` | `#0B0B0B` |
| vermelho | `#D71921` | `#D71921` |

### Fontes

Todas OFL, copiadas de `glyph-rice/config/fonts`, embutidas no app (nada carregado da rede, o APK
funciona offline). Incluir `OFL.txt` e citar em NOTICE.md.

- **Doto** (variável, `ROND` 100, peso 900, altura de linha 0.85): números de destaque e nada mais.
  Nunca abaixo de 26px, abaixo disso fica ilegível.
- **Space Grotesk**: todo o texto corrido, títulos, nomes de exercício.
- **Space Mono**: rótulos em maiúsculas com espaçamento largo, e números pequenos (células de
  tabela, eixos, valores secundários).

Regra para qualquer número: 26px ou mais usa Doto; menor usa Space Mono. Um número que hoje é
menor que 26px mas é o dado principal do seu cartão pode ser aumentado para caber na regra, desde
que o layout não quebre.

Números em Doto, no mínimo: série em curso (peso e reps), cronômetro do treino, timer de descanso,
1RM estimado, totais (treinos, séries, volume, PRs), sequência (streak), peso corporal e medidas
em destaque, valores grandes do resumo do treino e do recap.

Idiomas cujo alfabeto essas fontes não cobrem caem na fonte do sistema. Aceitável.

### Formas

- Cartões: fundo de cartão com borda fina de 1px, sem sombra, sem blur.
- Fundo das telas com grade de pontos sutil.
- Botão principal: pílula clara com texto escuro em Space Mono maiúsculo.
- Separadores de linha de tabela pontilhados.
- Aba ativa marcada por um ponto, rótulos das abas em Space Mono maiúsculo.

### Vermelho

Só marca o que está vivo: série em curso, descanso correndo, PR, o período atual num gráfico.
Meta: uma coisa vermelha por tela. Estados destrutivos e de erro também usam vermelho, como já
usam hoje. As outras cores do sistema (verde, azul, laranja...) viram tons de cinza onde eram
decoração; onde carregam significado (por exemplo o mapa de recuperação muscular), viram escala de
cinza a branco com vermelho no extremo.

### Gráficos

Viram matriz de pontos, mantendo os mesmos dados e as mesmas props:

- barras (`StatBars`, `WeeklySets`): colunas de pontos, apagados no tom de linha;
- linhas (`LineChart`): um ponto aceso por coluna sobre a grade apagada;
- anéis e progresso (`RestTimer`, `Streak`): pontos em círculo que acendem;
- `Heatmap`: células redondas em escala de cinza.

Toque, tooltips e acessibilidade dos gráficos continuam funcionando como hoje.

### Marca

- Nome no launcher: `openGym-N` (o Android não colore esse texto).
- Dentro do app, onde o nome aparece (abertura, login, sobre): "open" na cor de texto, "Gym" em
  vermelho, "-N" em cinza de rótulo (escolha minha).
- Ícone adaptativo: halter em pontos claros sobre preto, com camada monocromática para os ícones
  temáticos do Nothing OS.
- Cor de fundo da abertura e das barras do sistema: `#000000` no escuro.

## Como é feito

Escolhas minhas, salvo indicação:

- **Skin isolada.** Um arquivo `frontend/src/glyph.css`, importado em `main.jsx` depois de
  `index.css`, redefine os tokens de `:root` e de `[data-theme="light"]` e sobrescreve o que os
  tokens não alcançam. `index.css`, `coach.css` e `admin.css` não são editados, exceto se for
  inevitável. Isso mantém os merges com o original limpos.
- **Mudanças em JSX no mínimo necessário**: os componentes de gráfico listados acima, o nome com
  duas cores, e esconder nas Configurações as linhas de cor de destaque e de temas sazonais. A cor
  de destaque fica fixa e os temas sazonais nunca ativam, sem apagar o código deles.
- **Tema padrão** de uma instalação nova: escuro. Claro continua selecionável.
- **Android**: muda só o `applicationId` (sugestão `io.github.vandrovisky.opengymn`), o nome e os
  ícones. O `namespace` Java fica como está, para não mover pacotes. Cores de abertura em
  `capacitor.config.json` passam a preto.
- **Assinatura**: keystore própria, fora do repositório. Como o `applicationId` é outro, não há
  relação com a chave do app oficial.
- **Mídia dos exercícios**: só os arquivos de 180px que já estão no repositório, como o
  `build:mobile` já faz. Nada é adicionado ou trocado em `catalogue/media`.
- **Trabalho em um branch** (`glyph-skin`); `main` segue o original.

## Verificação

- `cd frontend && npm test` passa. Testes que fixam aparência (`design-review.test.js`,
  `a11y-contrast-transparency.test.js`, `accent-swatch.test.js` e parecidos) são atualizados para
  os novos valores, nunca apagados; o contraste de texto continua atendendo o que eles exigem.
- Os checks de CI do CLAUDE.md passam (`check-locales`, `check-source-strings --strict`, catálogo,
  coach assets, api docs).
- Nenhum arquivo em `frontend/src/lib` de lógica de treino muda.
- `npm run build:mobile` gera o projeto Android e o APK instala no Nothing Phone 2 ao lado do app
  oficial.
- Conferência visual no telefone: treino em andamento, descanso, fim de treino, progresso de um
  exercício, corpo/medidas, histórico, configurações, tema claro.

## Deixado para quem implementa

- Lista exata de seletores que recebem Doto ou Space Mono, seguindo a regra dos 26px.
- Geometria dos gráficos em pontos (tamanho do ponto, número de linhas) por componente.
- Desenho final do halter em pontos.
- Formato das fontes embutidas (woff2 se houver ferramenta, senão ttf) e subconjunto de glifos.
- Como montar o ambiente de build Android nesta máquina (WSL ou Windows).

## Desvios e decisões tomadas na implementação

- Cinza de rótulo no tema claro: `#696969` em vez de `#6E6E6E`, para ter 4,5:1 sobre o fundo `#E9E9E9`.
- O app não tem anéis. O timer de descanso virou 30 pontos em círculo e a sequência (streak) 20 pontos em
  linha. `WeeklySets` e as barras de progresso de Desafios não mudaram.
- A série em curso e o relógio do treino ficam em Space Mono: as caixas reais têm 39 a 48px e 13px de
  fonte, pequenas demais para Doto. O bloco grande "80 × 8" do mockup B não foi construído (precisa de
  mudança de layout, decisão do usuário).
- Dígitos do descanso correndo ficam na cor de texto; a barra de pontos leva o vermelho (o vermelho
  sobre o cartão elevado dá 3,4:1). O valor do vermelho `#D71921` não mudou, então texto pequeno de
  erro em vermelho fica em torno de 4,05:1 sobre preto, abaixo de 4,5:1.
- O app nunca verifica atualização nem mostra a linha de atualização: o feed de releases é o do
  openGym original e ofereceria o pacote oficial. O APK é atualizado à mão.
- Mapas do corpo e legendas usam escala de cinza a branco, com o vermelho no extremo da fadiga; o gráfico
  por série usa uma rampa de cinzas (`SET_RAMP`).
- O app Wear OS mantém o id antigo e não pareia com o `openGym-N`.
- Fontes embutidas como ttf/otf (sem ferramenta de woff2), cerca de 956 KB.
