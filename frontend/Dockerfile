# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_AUTH_SERVICE_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
# Copy the build output to Nginx's html folder
COPY --from=build /app/dist /usr/share/nginx/html
# Custom Nginx config (optional but recommended for SPA routing)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
