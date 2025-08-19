# Roteiro 1: Servidor de Aplicação Tradicional

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Curso de Engenharia de Software - PUC Minas**

---

## Objetivos

- Implementar um servidor HTTP tradicional usando Node.js e Express
- Compreender os fundamentos de APIs REST e sistemas cliente-servidor
- Gerenciar estado de aplicação de forma centralizada
- Implementar operações CRUD com autenticação JWT
- Estabelecer base para comparação com arquiteturas distribuídas

## Fundamentação Teórica

Segundo Coulouris et al. (2012), "um sistema distribuído é aquele no qual os componentes de hardware ou software localizados em computadores em rede se comunicam e coordenam suas ações apenas por meio de passagem de mensagens" <sup>[1]</sup>. 

A arquitetura cliente-servidor tradicional representa o modelo mais básico de sistema distribuído, onde:
- **Cliente**: Solicita serviços e recursos
- **Servidor**: Fornece serviços centralizados
- **Comunicação**: HTTP Request-Reply (Tanenbaum & Van Steen, 2017) <sup>[2]</sup>

### Características da Arquitetura

**Vantagens:**
- Simplicidade de desenvolvimento e deploy
- Controle centralizado de dados e estado
- Consistência garantida (transações ACID)

**Limitações:**
- Ponto único de falha
- Escalabilidade vertical limitada
- Possível gargalo de performance

## Cenário do Laboratório

Sistema de gerenciamento de tarefas (To-Do List) implementado como monólito, demonstrando os fundamentos de sistemas distribuídos através de comunicação HTTP/REST.

## Pré-requisitos

- Node.js 16+ e NPM
- Editor de código (VS Code)
- Postman ou similar para testes

