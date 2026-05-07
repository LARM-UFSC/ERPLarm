# Build stage
FROM node:18-alpine AS build

# Definir o diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar o código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar o build para o nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta
EXPOSE 80

# Iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
