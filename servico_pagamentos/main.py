from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CONFIGURAÇÃO CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELO DE DADOS ---
class DadosPagamento(BaseModel):
    pedido_id: str
    total: float

# --- ROTAS ---
@app.get("/")
def home():
    return {"mensagem": "Serviço de Pagamentos Ativo"}

@app.post("/pagamentos")
def processar_pagamento(dados: DadosPagamento):
    """
    Simula o processamento. Se total > 0, aprova.
    """
    print(f"Processando pagamento para pedido {dados.pedido_id} no valor de R$ {dados.total}")
    
    if dados.total > 0:
        return {
            "status_pagamento": "aprovado",
            "mensagem": "Pagamento aprovado com sucesso."
        }
    else:
        return {
            "status_pagamento": "recusado",
            "mensagem": "Valor inválido."
        }