FROM node:20-alpine
WORKDIR /app
# Le contexte de build est la racine du repo
# shared/ et client/ sont donc tous les deux accessibles
COPY client/package*.json ./
RUN npm install
COPY shared/ ./shared/
COPY client/ .
EXPOSE 5173
CMD ["npm", "run", "dev"]
