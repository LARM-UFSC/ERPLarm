# Configuração para Deploy em Servidor

## Problema
O frontend estava configurado para acessar o backend em `http://localhost:8000`, o que funciona localmente mas não em um servidor, pois `localhost` se refere ao navegador do cliente, não ao servidor.

## Solução Implementada
Agora o frontend usa uma variável de ambiente `VITE_API_BASE_URL` para configurar a URL do backend dinamicamente.

## Como Configurar no Servidor

### 1. Criar arquivo .env no servidor
No diretório do projeto (onde está o docker-compose.yml), crie um arquivo `.env`(Já criado):

```bash
cd /caminho/do/projeto/ERPLarm
nano .env
```

Adicionei o seguinte conteúdo (substitua com seu domínio/IP):

```env
# URL do Backend (substitua com seu domínio ou IP)
VITE_API_BASE_URL=http://SEU_IP_OU_DOMINIO:8000

# Origens permitidas para CORS (substitua com seu domínio)
CORS_ORIGINS=http://SEU_IP_OU_DOMINIO:3000,http://SEU_IP_OU_DOMINIO:80
```

**Exemplos:**

Se usar IP público:
```env
VITE_API_BASE_URL=http://192.168.1.100:8000
CORS_ORIGINS=http://192.168.1.100:3000,http://192.168.1.100:80
```

Se usar domínio:
```env
VITE_API_BASE_URL=https://api.seusite.com
CORS_ORIGINS=https://seusite.com,https://www.seusite.com
```

### 2. Reconstruir e reiniciar os containers

```bash
docker-compose down
docker-compose up --build -d
```

### 3. Verificar se está funcionando

Acesse `http://SEU_IP_OU_DOMINIO:3000` e teste o login ou qualquer funcionalidade que chame o backend.

## Notas Importantes

- A variável `VITE_API_BASE_URL` deve ser a URL pública acessível pelo navegador
- A variável `CORS_ORIGINS` deve incluir o domínio do frontend
- Se usar HTTPS, certifique-se de usar `https://` nas URLs
- Se o backend estiver atrás de um proxy/reverse proxy, configure a URL do proxy
