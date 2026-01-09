# Build Stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Point VITE_API_URL to the new Symfony Backend URL (likely /api or absolute URL)
# Since we have CORS potentially, let's assume we proxy or use absolute URL.
# For now, let's hardcode localhost:8000 (Backend Nginx) or relative path if we setup proxy.
# Let's try relative path assuming Nginx proxy, but wait, frontend runs on 8080, backend on 8000.
# We need to configure the Frontend Nginx to proxy /api to backend:8000 or backend:9000? NO.
# Let's keep specific Frontend Nginx config.
ENV VITE_API_URL=http://localhost:8000/api
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
