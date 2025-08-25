# Documentação da API de Gerenciamento de Tarefas

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Curso de Engenharia de Software - PUC Minas**

---

## 1. Visão Geral
Esta é uma **API REST** para um sistema de gerenciamento de tarefas (`To-Do List`), desenvolvida como parte do Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas.  
A API foi construída em **Node.js com Express**, seguindo uma arquitetura cliente-servidor tradicional.

A API implementa operações **CRUD** completas para tarefas, utiliza autenticação baseada em **JSON Web Tokens (JWT)** e inclui funcionalidades avançadas como paginação, filtros e cache em memória.

## 2. Configuração e Execução do Projeto

### Pré-requisitos
- Node.js 16+  
- NPM (geralmente instalado junto com o Node.js)

### Passos para Instalação:

#### 1. Clone este repositório para sua máquina local.  

#### 2. Navegue até o diretório do projeto:

```bash
cd lab01-servidor-tradicional
```

#### 3. Instale as dependências:

```Bash
npm install
```

### Executando o Servidor

#### Modo de Desenvolvimento (com auto-reload):

```Bash
npm run dev
```

#### Modo de Produção:
```Bash
npm start
```

#### O servidor será iniciado na porta 3000 por padrão. URL base: 
`http://localhost:3000.`

## 3. Autenticação

A API utiliza autenticação via JWT (JSON Web Token). Para acessar os endpoints protegidos (todas as rotas de /api/tasks), você precisa primeiro se autenticar para obter um token.

Fluxo de Autenticação:

1. Registre um novo usuário ou faça login com um usuário existente.

2. A API retornará um token no corpo da resposta.

3. Para todas as requisições subsequentes a endpoints protegidos, inclua o token no cabeçalho Authorization com o prefixo Bearer.

Exemplo de Cabeçalho: Authorization: Bearer seu_token_jwt_aqui

## 4. Endpoints da API

### 4.1. Autenticação (/api/auth)
Endpoints para registro e login de usuários.

### Registrar Novo Usuário

* Endpoint: POST /api/auth/register
* Descrição: Cria um novo usuário no sistema.
* Autenticação: Não requerida.
* Corpo da Requisição (Payload):
```json
{
  "email": "usuario@exemplo.com",
  "username": "novo_usuario",
  "password": "senha_forte_123",
  "firstName": "Fulano",
  "lastName": "de Tal"
}
```

* Resposta de Sucesso (201 Created):
```JSON
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "c1f7a4b0-...",
      "email": "usuario@exemplo.com",
      "username": "novo_usuario",
      "firstName": "Fulano",
      "lastName": "de Tal",
      "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
---

### Login de Usuário

* Endpoint: POST /api/auth/login
* Descrição: Autentica um usuário e retorna um token JWT.
* Autenticação: Não requerida.
* Corpo da Requisição (Payload):
```JSON
{
  "identifier": "usuario@exemplo.com",
  "password": "senha_forte_123"
}
```

* Resposta de Sucesso (200 OK):
```JSON
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "c1f7a4b0-...",
      "email": "usuario@exemplo.com",
      "username": "novo_usuario",
      /* ... */
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4.2. Tarefas (/api/tasks)
Endpoints para gerenciar as tarefas (operações CRUD). Todos os endpoints abaixo requerem autenticação JWT.

---

### Listar Tarefas

* Endpoint: GET /api/tasks
* Descrição: Retorna uma lista paginada das tarefas do usuário autenticado. Suporta múltiplos filtros.
* Parâmetros de Query (Opcionais):
  * page (number): O número da página a ser retornada. Padrão: 1.
  * limit (number): O número de tarefas por página. Padrão: 10.
  * completed (boolean): Filtra por status (true para completas, false para pendentes).
  * priority (string): Filtra por prioridade. Valores válidos: low, medium, high, urgent.
  * startDate (string): Filtra tarefas criadas a partir desta data (formato YYYY-MM-DD).
  * endDate (string): Filtra tarefas criadas até esta data (formato YYYY-MM-DD).
* Exemplo de URL com filtros: `http://localhost:3000/api/tasks?page=1&limit=5&priority=high&completed=false`
* Resposta de Sucesso (200 OK):
```JSON
{
  "success": true,
  "data": [
    {
      "id": "a2b3c4d5-...",
      "title": "Minha primeira tarefa",
      "description": "Descrição da tarefa.",
      "completed": false,
      "priority": "high",
      "userId": "c1f7a4b0-...",
      "createdAt": "..."
    }
  ],
  "meta": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "itemsPerPage": 5
  }
}
```
---

### Criar Nova Tarefa

* Endpoint: POST /api/tasks 
* Descrição: Cria uma nova tarefa para o usuário autenticado.
* Corpo da Requisição (Payload):
```JSON
{
  "title": "Comprar leite",
  "description": "Lembrar de verificar a data de validade.",
  "priority": "medium"
}
```
* Resposta de Sucesso (201 Created):
```JSON
{
  "success": true,
  "message": "Tarefa criada com sucesso",
  "data": {
    "id": "e6f7a8b9-...",
    "title": "Comprar leite",
    "description": "Lembrar de verificar a data de validade.",
    "completed": false,
    "priority": "medium",
    "userId": "c1f7a4b0-...",
    "createdAt": "..."
  }
}
```
---

### Buscar Tarefa por ID

* Endpoint: `GET /api/tasks/:id`
* Descrição: Retorna os detalhes de uma tarefa específica.
* Resposta de Sucesso (200 OK):
```JSON
{
  "success": true,
  "data": {
    "id": "e6f7a8b9-...",
    /* ...detalhes da tarefa... */
  }
}
```
---

### Atualizar Tarefa

* Endpoint: PUT /api/tasks/:id 
* Descrição: Atualiza os dados de uma tarefa existente.
* Corpo da Requisição (Payload):
```JSON
{
  "title": "Comprar leite integral",
  "description": "Lembrar de verificar a data de validade. Marca preferida: X.",
  "completed": true,
  "priority": "low"
}
```
* Resposta de Sucesso (200 OK):
```JSON
{
  "success": true,
  "message": "Tarefa atualizada com sucesso",
  "data": {
    "id": "e6f7a8b9-...",
    /* ...dados atualizados da tarefa... */
  }
}
```
---

### Deletar Tarefa

* Endpoint: `DELETE /api/tasks/:id` 
* Descrição: Remove uma tarefa do sistema.
* Resposta de Sucesso (200 OK):
```JSON
{
  "success": true,
  "message": "Tarefa deletada com sucesso"
}
```

