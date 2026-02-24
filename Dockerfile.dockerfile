# Stage 1: Build do frontend
FROM node:18-alpine AS builder
 
WORKDIR /app
 
# Copiar arquivos de dependências primeiro (para cache)
COPY package.json package-lock.json* ./
 
# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm install
 
# Copiar o restante dos arquivos
COPY . .
 
# Build do Vite
RUN npm run build
 
# Stage 2: Runtime
FROM node:18-alpine
 
WORKDIR /app
 
# Copiar package.json para instalar apenas dependências de produção
COPY package.json ./
 
# Instalar apenas dependências de produção
RUN npm install --omit=dev
 
# Copiar o build do Vite da stage anterior
COPY --from=builder /app/dist ./dist
 
# Copiar o servidor Express
COPY server.js ./
COPY src/data ./src/data
 
# Variável de ambiente para a porta
ENV PORT=7067
 
# Expor a porta
EXPOSE 7067
 
# Comando de inicialização
CMD ["node", "server.js"]
