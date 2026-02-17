# 🎨 Apresentação Visual do CenterTáxi MVP

## Visão Geral do Design

O CenterTáxi foi desenvolvido com um design elegante e moderno, utilizando um tema escuro (dark mode) com amarelo como cor primária. A interface é otimizada para mobile-first, garantindo uma experiência fluida em smartphones e tablets.

**Paleta de Cores:**
- **Fundo Primário:** #1a1a1a (Preto profundo)
- **Cor Primária:** #fbbf24 (Amarelo CenterTáxi)
- **Cor Secundária:** #ffffff (Branco)
- **Sucesso:** #10b981 (Verde)
- **Atenção:** #ef4444 (Vermelho)

---

## 📱 Interface do Passageiro

### Tela 1: Início - Mapa Principal

A tela inicial mostra um mapa interativo com a localização do usuário no centro. Um grande botão amarelo no rodapé permite solicitar uma corrida.

**Elementos principais:**
- Mapa em tempo real com marcadores de táxis disponíveis
- Localização do usuário (marcador amarelo no centro)
- Botão "Solicitar Corrida" em destaque
- Menu de navegação inferior com acesso a histórico e perfil

**Funcionalidades:**
- Geolocalização automática
- Visualização de motoristas próximos
- Atualização em tempo real

---

### Tela 2: Solicitar Corrida

Ao clicar em "Solicitar Corrida", o usuário vê um formulário com dois campos: origem e destino.

**Elementos principais:**
- Campo de origem com ícone verde (📍)
- Campo de destino com ícone vermelho (📍)
- Pré-visualização da rota no mapa (linha azul)
- Informações de distância (5.2 km)
- Preço estimado em destaque (R$ 18,20)
- Botão "Confirmar Corrida" em amarelo

**Funcionalidades:**
- Autocomplete de endereços (Google Places API)
- Cálculo automático de distância e preço
- Visualização da rota antes de confirmar
- Possibilidade de ajustar origem/destino

---

### Tela 3: Aguardando Motorista

Após confirmar a corrida, o app mostra o status "Procurando Motorista..." com uma animação de carregamento.

**Elementos principais:**
- Animação de busca (ícone de bússola girando)
- Detalhes da corrida (origem, destino, distância, preço)
- Mapa com localização do usuário
- Botão "Cancelar" em amarelo

**Funcionalidades:**
- Atualização em tempo real do status
- Possibilidade de cancelar a corrida
- Visualização dos detalhes da corrida

---

### Tela 4: Motorista a Caminho

Quando um motorista aceita a corrida, o app mostra o status "Motorista a Caminho".

**Elementos principais:**
- Mapa com localização do usuário (azul) e motorista (amarelo com ícone de carro)
- Rota entre motorista e usuário (linha azul)
- Informações do motorista: nome, avaliação (4.8 ⭐), foto
- Tempo estimado de chegada (8 min)
- Botão "Chamar Motorista" para contato direto

**Funcionalidades:**
- Rastreamento em tempo real do motorista
- Informações de contato do motorista
- Avaliação prévia do motorista
- Possibilidade de cancelar ainda

---

## 🚗 Interface do Motorista

### Tela 1: Lista de Corridas Disponíveis

A tela principal do motorista mostra uma lista de corridas disponíveis para aceitar.

**Elementos principais:**
- Cards com informações de cada corrida
- Origem (ícone verde 📍)
- Destino (ícone vermelho 📍)
- Distância (5.2 km)
- Preço (R$ 18,20) em amarelo
- Botão "Aceitar Corrida" em amarelo

**Funcionalidades:**
- Atualização automática a cada 5 segundos
- Múltiplas corridas disponíveis
- Informações claras e rápidas
- Aceitar com um clique

---

### Tela 2: Corrida Aceita - Ir Buscar Passageiro

Após aceitar uma corrida, o motorista vê um mapa com a localização do passageiro.

**Elementos principais:**
- Mapa em tela cheia
- Localização do motorista (carro amarelo)
- Localização do passageiro (pin azul)
- Rota entre motorista e passageiro (linha amarela)
- Card com informações do passageiro: nome, avaliação, telefone
- Detalhes da corrida: origem, destino, distância, preço
- Botão "Iniciar Corrida" em amarelo

**Funcionalidades:**
- Navegação até o passageiro
- Informações do passageiro
- Possibilidade de ligar para o passageiro
- Iniciar corrida quando chegar

---

### Tela 3: Corrida em Andamento

Durante a corrida, o motorista acompanha o trajeto até o destino.

**Elementos principais:**
- Mapa com rota em tempo real
- Localização do motorista (carro amarelo)
- Localização do passageiro (pin azul)
- Status "Em Andamento"
- Informações do passageiro
- Tempo estimado de chegada (5 min)
- Botão "Finalizar Corrida" em amarelo

**Funcionalidades:**
- Navegação em tempo real
- Atualização contínua de localização
- Informações do passageiro sempre visíveis
- Finalizar corrida ao chegar

---

### Tela 4: Histórico de Corridas

O motorista pode visualizar seu histórico de corridas e ganhos.

**Elementos principais:**
- Estatísticas no topo:
  - Total de Corridas: 12
  - Ganho Total: R$ 218,40
- Cards com histórico de corridas
- Data/hora de cada corrida
- Origem e destino
- Distância e preço
- Status (Completed com ✓ verde)

**Funcionalidades:**
- Visualizar todas as corridas passadas
- Ver ganhos totais
- Acompanhar histórico completo
- Estatísticas de desempenho

---

## 🎯 Fluxo Completo de Uma Corrida

### Do Ponto de Vista do Passageiro

1. **Acesso:** Abre o app → Vê mapa com botão "Solicitar Corrida"
2. **Solicitação:** Clica no botão → Preenche origem e destino → Vê preço estimado
3. **Confirmação:** Clica "Confirmar Corrida" → App começa a buscar motorista
4. **Espera:** Vê status "Procurando Motorista..." com animação de carregamento
5. **Aceito:** Motorista aceita → Status muda para "Motorista a Caminho"
6. **Rastreamento:** Vê motorista se aproximando no mapa → Tempo de chegada
7. **Chegada:** Motorista chega → Passageiro entra no carro
8. **Em Andamento:** Status muda para "Em Andamento" → Acompanha trajeto
9. **Conclusão:** Chega no destino → Corrida marcada como concluída

### Do Ponto de Vista do Motorista

1. **Acesso:** Abre o app → Vê lista de corridas disponíveis
2. **Seleção:** Vê múltiplas corridas com origem, destino e preço
3. **Aceitação:** Clica "Aceitar Corrida" em uma corrida
4. **Navegação:** Vê mapa com localização do passageiro → Rota para buscar
5. **Busca:** Navega até o passageiro → Vê informações do passageiro
6. **Chegada:** Clica "Iniciar Corrida" quando chega
7. **Trajeto:** Acompanha rota até destino → Status "Em Andamento"
8. **Conclusão:** Chega no destino → Clica "Finalizar Corrida"
9. **Ganho:** Corrida concluída → Ganho adicionado ao total

---

## 🎨 Componentes de Design

### Botões

Todos os botões principais são amarelos (#fbbf24) com texto em preto. Eles ocupam a largura completa da tela e têm altura de 56px para fácil toque em mobile.

**Estados:**
- **Normal:** Amarelo sólido
- **Hover:** Amarelo mais escuro
- **Desabilitado:** Cinza

### Cards

Cards são usados para exibir informações de corridas. Têm fundo escuro (#2a2a2a) com borda sutil e sombra.

**Estrutura:**
- Ícone ou imagem no topo
- Título e informações principais
- Detalhes secundários (distância, preço)
- Botão de ação

### Mapas

O Google Maps é integrado com tema escuro personalizado. Marcadores são coloridos:
- **Verde:** Origem
- **Vermelho:** Destino
- **Amarelo:** Motorista/Localização do usuário
- **Azul:** Passageiro

### Tipografia

- **Título:** Roboto Bold, 24px
- **Subtítulo:** Roboto Medium, 18px
- **Corpo:** Roboto Regular, 16px
- **Pequeno:** Roboto Regular, 14px

---

## 📊 Responsividade

O app é otimizado para todos os tamanhos de tela:

| Dispositivo | Largura | Otimização |
|---|---|---|
| Smartphone | 320-480px | Layout em coluna única |
| Tablet | 481-768px | Ajuste de espaçamento |
| Desktop | 769px+ | Versão web responsiva |

---

## ✨ Diferenciais Visuais

### 1. Tema Escuro Elegante
O tema escuro reduz fadiga ocular e economiza bateria em dispositivos OLED, além de ser moderno e profissional.

### 2. Amarelo como Destaque
A cor amarela (#fbbf24) é usada estrategicamente para destacar botões, preços e elementos importantes, criando uma identidade visual forte.

### 3. Animações Suaves
Transições suaves entre telas e animações de carregamento melhoram a experiência do usuário.

### 4. Ícones Intuitivos
Ícones claros e universais (pins de mapa, carros, telefones) facilitam o entendimento imediato das funcionalidades.

### 5. Informações Hierárquicas
As informações mais importantes (preço, status, nome do motorista) são exibidas em destaque com fonte maior e cor diferenciada.

---

## 🔄 Próximas Melhorias Visuais

- [ ] Modo claro (light mode) opcional
- [ ] Temas customizáveis por cidade
- [ ] Animações mais sofisticadas
- [ ] Ícones personalizados
- [ ] Gradientes e efeitos visuais avançados
- [ ] Modo acessibilidade com contraste aumentado

---

## 📸 Resumo Visual

O CenterTáxi MVP apresenta uma interface moderna, intuitiva e elegante. O design dark mode com amarelo como cor primária cria uma identidade visual forte e memorável. Todas as funcionalidades essenciais são acessíveis com poucos cliques, oferecendo uma experiência fluida tanto para passageiros quanto para motoristas.

A apresentação visual é profissional e pronta para apresentação aos sócios, demonstrando um produto bem pensado e polido.
