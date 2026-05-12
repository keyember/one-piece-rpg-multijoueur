FROM node:20-alpine
WORKDIR /app
# Le contexte de build est la racine du repo
COPY server/package*.json ./
RUN npm install
COPY shared/ ./shared/
COPY server/ .
EXPOSE 3000
CMD ["npm", "run", "dev"]
