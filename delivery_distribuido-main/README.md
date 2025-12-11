🛵 Sistema Distribuído de Delivery de Pedidos

Projeto desenvolvido para a disciplina de Sistemas Distribuídos, ministrada pelo professor Robson Wagner Medeiros.

O sistema simula um serviço de delivery utilizando uma arquitetura baseada em microserviços, onde cada módulo funciona como um serviço independente e se comunica via HTTP/REST.
Foram implementados três módulos de backend (Catálogo, Pedidos e Pagamentos) e um módulo de Frontend Web.

👥 Integrantes da Equipe

Breno Jordão
Yuri Catunda

[ Frontend Web ] --> (HTTP:8002) --> [ Serviço de Pedidos ]
           |                              |          |
           |                              v          v
           |                     (HTTP:8001)   (HTTP:8003)
           |                     [ Catálogo ]   [ Pagamentos ]
