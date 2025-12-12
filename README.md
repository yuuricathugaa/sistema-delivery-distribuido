# Sistema de Delivery Distribuído 🍕

Projeto desenvolvido para a disciplina de **Projeto e Arquitetura de Sistemas**. O objetivo foi criar um sistema distribuído composto por microserviços independentes que se comunicam via HTTP/REST.

**Alunos:**
* Breno Jordão
* Yuri Catunda

## 🚀 Arquitetura

O sistema é dividido em 4 módulos independentes:

1.  **Frontend (Porta 8000/5500):** Interface Web (HTML/JS) para interação do usuário.
2.  **Serviço de Catálogo (Porta 8001):** API Python que fornece os dados dos produtos.
3.  **Serviço de Pedidos (Porta 8002):** API Python central que gerencia compras, persiste dados em JSON e orquestra chamadas aos outros serviços.
4.  **Serviço de Pagamentos (Porta 8003):** API Python que simula a aprovação financeira.

## 🛠️ Tecnologias

* **Python 3** (Backend)
* **FastAPI** & **Uvicorn** (Servidor Web)
* **HTML5, CSS3, JavaScript** (Frontend)
* **Fetch API** (Comunicação Assíncrona)
