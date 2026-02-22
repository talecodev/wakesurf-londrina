
## Integrar API AtendiTop para envio de WhatsApp

### O que sera feito
Criar uma edge function que envia mensagens via WhatsApp usando a API do AtendiTop, e integrar nos pontos-chave do sistema:

1. **Confirmacao de agendamento** -- ao confirmar pagamento, enviar mensagem automatica ao rider
2. **Botao de alerta no Admin** -- substituir o link wa.me por envio real via API
3. **Reutilizavel** -- uma unica edge function que aceita numero e mensagem

### Etapas

**Etapa 1 -- Configurar o token como secret**
- Solicitar ao usuario que insira o token da AtendiTop como secret `ATENDITOP_API_TOKEN`

**Etapa 2 -- Criar edge function `send-whatsapp`**
- Endpoint interno que recebe `{ number, body }` e faz POST para a API do AtendiTop
- URL: `https://app.atenditop.com.br:443/backend/api/messages/send`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body padrao: `saveOnTicket: true`, `linkPreview: true`, `startChatbot: false`

**Etapa 3 -- Enviar mensagem automatica na confirmacao de pagamento**
- No `PagamentoScreen.tsx`, apos confirmar pagamento, chamar a edge function com o telefone do usuario e mensagem de confirmacao
- Mensagem exemplo: "Ola [nome]! Sua sessao de Wakeboard esta confirmada para [data] as [hora]. Nos vemos no spot! - Wakesurf Londrina"

**Etapa 4 -- Integrar no Admin Dashboard**
- Substituir o link `wa.me` pelo envio via edge function, para que o admin envie alertas diretamente pela API

### Detalhes tecnicos

- **Edge function**: `supabase/functions/send-whatsapp/index.ts`
- **Secret necessario**: `ATENDITOP_API_TOKEN` (o token que o usuario ja possui)
- **Formato do numero**: string com codigo do pais + DDD + numero, sem caracteres especiais (ex: `5543999999999`)
- **Arquivos modificados**: `src/pages/PagamentoScreen.tsx`, `src/pages/AdminDashboard.tsx`
- **config.toml**: adicionar `[functions.send-whatsapp]` com `verify_jwt = false`
