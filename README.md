# 🥦 FoodShare

Aplicativo mobile de doação e redistribuição de alimentos desenvolvido como projeto extensionista da Universidade de Fortaleza (UNIFOR).

> **Disciplina:** T197 - Desenvolvimento de Plataformas Móveis  
> **Docente:** Lyndainês Santos

## 👥 Equipe

| Nome | Matrícula |
|------|-----------|
| Carlos Alberto Freitas Gonçalves | 2422750 |
| Antonio Gervasio Lopes Neto | 2417773 |
| Victor Gomes Barbosa | 2426030 |

---

## 📋 Descrição

O FoodShare conecta **doadores de alimentos** (restaurantes e pessoas físicas) a **ONGs e indivíduos** que necessitam. A plataforma permite cadastrar doações, localizar oportunidades próximas por geolocalização e facilitar a redistribuição de alimentos de forma eficiente.

---

## 🚀 Tecnologias

- **React Native** com [Expo](https://expo.dev/) (SDK 54)
- **TypeScript**
- **Supabase** — autenticação, banco de dados e storage
- **React Navigation** — bottom tabs + stack
- **react-native-maps** — mapa de doações
- **expo-image-picker** — upload de fotos
- **expo-location** — geolocalização

---

## 📱 Telas

| Tela | Descrição |
|------|-----------|
| Login | Autenticação com e-mail e senha |
| Cadastro | Criação de conta como Doador ou Receptor |
| Home | Lista de doações disponíveis com busca |
| Mapa | Visualização das doações no mapa |
| Detalhe da Doação | Informações completas + solicitação |
| Nova Doação | Formulário para cadastrar doação |
| Minhas Doações | Histórico e gerenciamento (doador) |
| Solicitações | Aprovar ou recusar pedidos (doador) |
| Notificações | Alertas de solicitações e atualizações |
| Perfil & Impacto | Dados do usuário e métricas de doações |

---

## ✅ Requisitos Funcionais

| ID | Nome | Status |
|----|------|--------|
| RF01 | Cadastro de Usuários (doador/receptor) | ✅ Implementado |
| RF02 | Autenticação (login/logout) | ✅ Implementado |
| RF03 | Edição de Perfil | 🔧 Parcial |
| RF04 | Cadastro de Doação | ✅ Implementado |
| RF05 | Gerenciamento de Doação (editar/excluir) | ✅ Implementado |
| RF06 | Visualização de Solicitações | ✅ Implementado |
| RF07 | Aprovação/Recusa de Solicitações | ✅ Implementado |
| RF08 | Lista de Doações disponíveis | ✅ Implementado |
| RF09 | Mapa de Doações com geolocalização | 🔧 Em desenvolvimento |
| RF10 | Atualização de Status da doação | ✅ Implementado |
| RF11 | Histórico do Doador | ✅ Implementado |
| RF12 | Histórico do Receptor | 🔧 Parcial |
| RF13 | Métricas de Impacto | ✅ Implementado |

---

## ⚙️ Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Conta no [Supabase](https://supabase.com/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/GervasioNeto/food-share.git
cd food-share

# Instale as dependências
npm install
```

### Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

Preencha com as credenciais do seu projeto Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### Banco de dados

Execute o SQL disponível em [`docs/schema.sql`](docs/schema.sql) no **SQL Editor** do Supabase para criar as tabelas necessárias (`profiles`, `donations`, `requests`, `notifications`).

### Executar

```bash
npx expo start
```

| Plataforma | Comando |
|------------|---------|
| Android | `npx expo start --android` |
| iOS | `npx expo start --ios` |
| Web | `npx expo start --web` |

---

## 🗄️ Estrutura do Banco de Dados

```
profiles      — dados do usuário (nome, papel, endereço)
donations     — doações cadastradas pelos doadores
requests      — solicitações feitas pelos receptores
notifications — notificações enviadas aos usuários
```

---

## 📂 Estrutura do Projeto

```
src/
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
├── lib/
│   └── supabase.ts         # Cliente Supabase
├── navigation/
│   └── navigation.tsx      # Configuração de rotas
└── screens/
    ├── LoginScreen.tsx
    ├── RegisterScreen.tsx
    ├── HomeScreen.tsx
    ├── MapScreen.tsx
    ├── DonationDetailScreen.tsx
    ├── NewDonationScreen.tsx
    ├── MyDonationsScreen.tsx
    ├── RequestsScreen.tsx
    ├── NotificationsScreen.tsx
    └── ProfileScreen.tsx
```

---

## 📌 Observações

- O sistema **não intermedia pagamentos** entre usuários
- O sistema **não garante qualidade sanitária** dos alimentos
- Destinado exclusivamente a **fins não comerciais**
- Requer conexão com internet (sem modo offline)
