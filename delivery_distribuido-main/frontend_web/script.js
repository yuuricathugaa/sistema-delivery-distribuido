// Estado da Aplicação
let carrinho = [];
let meusPedidos = []; 
let catalogoCache = []; // NOVA VARIÁVEL: Guarda os nomes dos produtos para consulta

// --- NAVEGAÇÃO ---
function showScreen(screenName) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Mostra a tela desejada
    const target = document.getElementById(`screen-${screenName}`);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Atualiza título do Header
    const titles = {
        'catalogo': 'Catálogo de Produtos',
        'carrinho': 'Carrinho',
        'meus-pedidos': 'Meus Pedidos',
        'pagamento': 'Pagamento'
    };
    document.getElementById('header-title').innerText = titles[screenName] || 'Delivery';
    
    // Lógica específica de cada tela
    if (screenName === 'carrinho') renderCarrinho();
    if (screenName === 'meus-pedidos') carregarHistoricoDePedidos();
}

// --- INTEGRAÇÃO CATÁLOGO (Porta 8001) ---
async function carregarProdutos() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<p>Carregando cardápio...</p>';
    
    try {
        const response = await fetch('http://localhost:8001/produtos');
        const produtos = await response.json();

        // [IMPORTANTE] Salvamos a lista na memória para usar depois na tela de Pedidos
        catalogoCache = produtos;

        grid.innerHTML = ''; 

        produtos.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.onclick = () => adicionarAoCarrinho(p);
            div.innerHTML = `
                <div class="product-img" style="background-image: url('${p.imagem}')"></div>
                <h4>${p.nome}</h4>
                <p>R$ ${p.preco.toFixed(2)}</p>
            `;
            grid.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        grid.innerHTML = '<p style="color:red">Erro ao carregar. O servidor 8001 está rodando?</p>';
    }
}

// --- INTEGRAÇÃO PEDIDOS (Porta 8002) ---
async function carregarHistoricoDePedidos() {
    const lista = document.getElementById('orders-list');
    lista.innerHTML = '<p style="text-align:center">Buscando seus pedidos...</p>';

    // Se o catálogo ainda não carregou (caso raro), tenta carregar rapidinho para termos os nomes
    if (catalogoCache.length === 0) {
        await carregarProdutos();
    }

    try {
        const response = await fetch('http://localhost:8002/pedidos');
        
        if (response.ok) {
            meusPedidos = await response.json();
            meusPedidos.reverse(); // Mais recente no topo
            renderMeusPedidos();
        } else {
            lista.innerHTML = '<p>Erro ao buscar pedidos.</p>';
        }
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        lista.innerHTML = '<p style="color:red">Erro de conexão com o servidor de Pedidos (8002).</p>';
    }
}

// --- LÓGICA DO CARRINHO ---
function adicionarAoCarrinho(produto) {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    alert(`${produto.nome} adicionado ao carrinho!`);
}

function renderCarrinho() {
    const lista = document.getElementById('cart-items-list');
    const totalElem = document.getElementById('cart-total-price');
    lista.innerHTML = '';
    
    let total = 0;

    if (carrinho.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            total += item.preco * item.quantidade;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    Qtd: ${item.quantidade} x R$ ${item.preco.toFixed(2)}
                </div>
                <button onclick="removerItem(${index})" style="background:var(--primary-red); color:white; border:none; border-radius:4px; padding: 5px 10px; cursor:pointer;">X</button>
            `;
            lista.appendChild(div);
        });
    }
    
    totalElem.innerText = `R$ ${total.toFixed(2)}`;
}

function removerItem(index) {
    carrinho.splice(index, 1);
    renderCarrinho();
}

function checkout() {
    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        return;
    }
    showScreen('pagamento');
}

// --- PAGAMENTO E FINALIZAÇÃO ---
function copyPix() {
    const code = document.querySelector('.pix-code').innerText;
    navigator.clipboard.writeText(code);
    alert("Código PIX copiado!");
}

async function finishOrderSimulation() {
    const itensParaEnvio = carrinho.map(item => {
        return {
            id_produto: item.id,
            quantidade: item.quantidade
        };
    });

    try {
        const response = await fetch('http://localhost:8002/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itensParaEnvio)
        });

        if (response.ok) {
            const pedidoCriado = await response.json();
            alert(`Pedido realizado com sucesso!\nID: ${pedidoCriado.id}\nStatus: ${pedidoCriado.status}`);
            carrinho = []; 
            showScreen('meus-pedidos');
        } else {
            alert("Erro ao criar pedido. Verifique se o servidor 8002 está rodando.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão com o Serviço de Pedidos.");
    }
}

function renderMeusPedidos() {
    const lista = document.getElementById('orders-list');
    lista.innerHTML = '';

    if (meusPedidos.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Você ainda não tem pedidos.</p>';
        return;
    }

    meusPedidos.forEach(pedido => {
        // [CORREÇÃO AQUI] Cruzamento de dados: ID do Pedido -> Nome do Catálogo
        let resumoItens = "";
        
        if(pedido.itens && pedido.itens.length > 0) {
            resumoItens = pedido.itens.map(item => {
                // Procura o produto no cache que baixamos do catálogo
                const produtoInfo = catalogoCache.find(p => p.id === item.id_produto);
                const nomeProduto = produtoInfo ? produtoInfo.nome : `Item ID ${item.id_produto}`;
                
                return `${item.quantidade}x ${nomeProduto}`;
            }).join(', ');
        } else {
            resumoItens = "Detalhes indisponíveis";
        }

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'flex-start';
        
        // Cores do status
        let corStatus = 'black';
        if(pedido.status === 'pago') corStatus = 'green';
        if(pedido.status === 'aguardando pagamento') corStatus = 'orange';
        if(pedido.status === 'pagamento recusado') corStatus = 'red';

        div.innerHTML = `
            <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:5px;">
                <strong>Pedido <span style="font-size:0.8em">${pedido.id.substring(0,8)}...</span></strong>
                <span style="color:${corStatus}; font-weight:bold;">${pedido.status}</span>
            </div>
            <div style="font-size: 0.9rem; color: #555;">
                ${resumoItens}
            </div>
            <div style="width:100%; text-align:right; margin-top:5px; font-weight:bold;">
                Total: R$ ${pedido.total.toFixed(2)}
            </div>
        `;
        lista.appendChild(div);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});