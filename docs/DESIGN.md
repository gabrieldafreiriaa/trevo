# Design

Protótipo aprovado (Opção A): [canvas no Claude](https://claude.ai/artifact/TzPC4nVd5P3wNxj9GZu8jQ). As telas do protótipo ainda mostram o nome antigo, "Prumo".

## Princípios

- **Limpo e com identidade.** O verde vivo é o **destaque**, nunca o fundo de grandes blocos.
- **O número é o protagonista.** Valores em Space Grotesk, grandes e com tracking negativo.
- **Simples para quem não é de tecnologia.** Poucas ações por tela, rótulos claros e alvos de toque de 44 px ou mais.
- **Cor sempre com texto.** A situação aparece como uma pílula com cor e palavra, nunca só como cor.

## Marca

- **Nome:** Trevo
- **Logo:** um trevo de quatro folhas em traço (stroke), na cor `green-500`, acompanhado do nome em Space Grotesk 600. A ser desenhado no S1.

## Tokens

### Cores

| Token | Hex | Uso |
|---|---|---|
| `background` | `#F5F6F4` | Fundo da página |
| `surface` | `#FFFFFF` | Cards, menu e campos |
| `border` | `#E6E8E4` | Bordas de cards |
| `border-input` | `#DCE0DA` | Bordas de campos e botões secundários |
| `divider` | `#F0F2EE` | Linhas entre itens de lista |
| `foreground` | `#0B140E` | Texto principal |
| `muted-foreground` | `#5E6A61` | Texto de apoio |
| `graphite` | `#16181A` | Card do saldo, item ativo do menu e barras de saídas |
| `primary` | `#22C55E` | Botão principal, destaques e barras de entradas |
| `primary-foreground` | `#04210F` | Texto sobre o `primary` |
| `income` | `#15803D` | Valores de entrada (texto) |
| `expense` | `#B91C1C` | Valores de saída (texto) |

### Situação (pílulas)

| Situação | Fundo | Texto |
|---|---|---|
| Pago / Recebido | `#DCFCE7` | `#14532D` |
| Pendente | `#FEF3C7` | `#7A4E00` |
| Parcial | `#E0E7FF` | `#3730A3` |
| Atrasado | `#FEE2E2` | `#991B1B` |

### Tipografia

| Uso | Fonte | Peso | Tamanho |
|---|---|---|---|
| Título do mês | Space Grotesk | 600 | 30 px (computador) / 24 px (celular) |
| Saldo em destaque | Space Grotesk | 600 | 46 px / 36 px, tracking −1.5 px |
| Valores de card | Space Grotesk | 600 | 28 px / 20 px |
| Títulos de seção | Inter | 600 | 17 px / 15 px |
| Texto | Inter | 400–500 | 14–15 px |
| Legendas | Inter | 400 | 12–13 px |

### Forma

| Token | Valor |
|---|---|
| Raio dos cards | 20 px |
| Raio de botões e campos | 12 px |
| Raio das pílulas | 999 px |
| Altura de botão e campo | 44 a 48 px |
| Espaço entre cards | 16 px |
| Padding da página | 32 a 40 px (computador) / 20 px (celular) |
| Sombras | nenhuma. A separação vem das bordas de 1 px |

## Telas

| Tela | Computador | Celular |
|---|---|---|
| Layout | Menu lateral branco, com o item ativo em grafite e a seção "Admin" para o admin | Barra inferior com Início, Extrato, "+" (verde, em destaque), Relatórios e Perfil |
| Dashboard | Cabeçalho do mês com setas · card do saldo (grafite ou branco, a decidir no S5) · cards de entradas e saídas · por categoria · por forma de pagamento · últimos 6 meses · próximos vencimentos · últimos lançamentos | Saldo · a pagar e a receber · próximos vencimentos · distribuição por categoria |
| Novo lançamento | Modal | Tela cheia: seletor saída/entrada, valor grande, descrição, chips de categoria, forma de pagamento, vencimento, repetir (não / todo mês / parcelado), situação (pago / pendente / parcial) e "quanto já foi pago" |
| Visão do admin | Seletor "Visualizando o painel de", com um aviso de somente leitura | Mesmo seletor, na tela de Perfil |
