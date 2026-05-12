FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
# Copier shared/ dans le container pour que Vite puisse le résoudre
COPY ../shared ./shared
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
