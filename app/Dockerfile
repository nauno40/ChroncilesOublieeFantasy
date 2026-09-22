# Build Stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite grave VITE_API_URL dans le bundle AU BUILD, pas au runtime : un déploiement réel doit
# le passer via --build-arg VITE_API_URL=https://api.mondomaine.example/api, sous peine
# d'expédier en prod un front qui continue d'appeler localhost:8000 chez chaque visiteur.
# La valeur par défaut ne sert qu'au développement local.
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
