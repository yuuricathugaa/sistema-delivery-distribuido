import requests
import uuid
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# --- CONFIGURAÇÃO CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS ---
class ItemPedido(BaseModel):
    id_produto: int
    quantidade: int

class Pedido(BaseModel):
    id: str
    itens: List[ItemPedido]
    total: float
    status: str

# --- PERSISTÊNCIA EM ARQUIVO (O REQUISITO DO 10) ---
ARQUIVO_PEDIDOS = "pedidos.json"

def carregar_pedidos():
    if not os.path.exists(ARQUIVO_PEDIDOS):
        return []
    try:
        with open(ARQUIVO_PEDIDOS, "r") as f:
            return json.load(f)
    except:
        return []

def salvar_pedido_no_arquivo(novo_pedido_dict):
    pedidos = carregar_pedidos()
    pedidos.append(novo_pedido_dict)
    with open(ARQUIVO_PEDIDOS, "w") as f:
        json.dump(pedidos, f, indent=4)
    print(f"💾 Pedido {novo_pedido_dict['id']} salvo no disco com sucesso!")

# Carrega pedidos ao iniciar
pedidos_db = carregar_pedidos()

# --- COMUNICAÇÃO ---
def obter_preco_do_catalogo(id_produto):
    print(f"📡 Consultando Catálogo (8001) sobre produto {id_produto}...")
    try:
        resposta = requests.get(f"http://localhost:8001/produtos/{id_produto}")
        if resposta.status_code == 200:
            preco = resposta.json()['preco']
            print(f"   ✅ Preço recebido: R$ {preco}")
            return preco
        return 0.0
    except:
        print("   ❌ Erro de conexão com o Catálogo!")
        return 0.0

def processar_pagamento_remoto(id_pedido, valor_total):
    print(f"💸 Solicitando Pagamento ao serviço (8003)...")
    try:
        payload = {"pedido_id": id_pedido, "total": valor_total}
        resposta = requests.post("http://localhost:8003/pagamentos", json=payload)
        
        if resposta.status_code == 200:
            status = resposta.json()["status_pagamento"]
            print(f"   ✅ Resposta do Pagamento: {status}")
            return status
        return "erro_pagamento"
    except:
        print("   ❌ Erro de conexão com o Pagamento!")
        return "servico_pagamento_indisponivel"

# --- ROTAS ---
@app.get("/")
def home():
    return {"mensagem": "Serviço de Pedidos Ativo"}

@app.get("/pedidos")
def listar_pedidos():
    # Sempre lê do arquivo para garantir dados atualizados
    return carregar_pedidos()

@app.post("/pedidos")
def criar_pedido(itens: List[ItemPedido]):
    print(f"\n📦 NOVO PEDIDO RECEBIDO COM {len(itens)} ITENS")
    
    total_calculado = 0.0
    for item in itens:
        preco = obter_preco_do_catalogo(item.id_produto)
        if preco == 0.0:
            raise HTTPException(status_code=400, detail=f"Erro no produto {item.id_produto}")
        total_calculado += preco * item.quantidade

    novo_pedido = {
        "id": str(uuid.uuid4()),
        "itens": [i.dict() for i in itens],
        "total": total_calculado,
        "status": "aguardando pagamento"
    }
    
    resultado_pagamento = processar_pagamento_remoto(novo_pedido["id"], total_calculado)
    
    if resultado_pagamento == "aprovado":
        novo_pedido["status"] = "pago"
    elif resultado_pagamento == "recusado":
        novo_pedido["status"] = "pagamento recusado"
    else:
        novo_pedido["status"] = "erro no processamento"

    # Salva no arquivo JSON (Atendendo o requisito)
    salvar_pedido_no_arquivo(novo_pedido)
    
    return novo_pedido

@app.get("/pedidos/{id_pedido}")
def consultar_status(id_pedido: str):
    pedidos = carregar_pedidos()
    for pedido in pedidos:
        if pedido["id"] == id_pedido:
            return pedido
    raise HTTPException(status_code=404, detail="Pedido não encontrado")