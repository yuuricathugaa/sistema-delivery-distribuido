from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI()

# --- CONFIGURAÇÃO DO CORS ---
# Permite que o Frontend na porta 8000 acesse este serviço
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELO DE DADOS ---
# Define como é um Produto (igual ao seu PDF, mas adicionei a imagem para o Front)
class Produto(BaseModel):
    id: int
    nome: str
    preco: float
    imagem: str 

# --- BANCO DE DADOS EM MEMÓRIA ---
produtos_db = [
    {"id": 1, "nome": "Calabresa", "preco": 40.00, "imagem": "assets/calabresa.jpg"},
    {"id": 2, "nome": "4 Queijos", "preco": 45.00, "imagem": "assets/4queijos.jpg"},
    {"id": 3, "nome": "Frango/Catupiry", "preco": 42.00, "imagem": "assets/frango.jpg"},
    {"id": 4, "nome": "Portuguesa", "preco": 48.00, "imagem": "assets/portuguesa.jpg"}
]

# --- ROTAS (ENDPOINTS) ---

@app.get("/")
def home():
    return {"mensagem": "Serviço de Catálogo Ativo"}

@app.get("/produtos", response_model=List[Produto])
def listar_produtos():
    """
    Retorna a lista de todos os produtos disponíveis.
    """
    return produtos_db

@app.get("/produtos/{produto_id}", response_model=Produto)
def obter_produto(produto_id: int):
    """
    Retorna os detalhes de um produto específico.
    """
    for produto in produtos_db:
        if produto["id"] == produto_id:
            return produto
    return {"erro": "Produto não encontrado"}