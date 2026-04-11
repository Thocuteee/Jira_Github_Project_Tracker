# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_GATEWAY_URL
ARG VITE_AUTH_SERVICE_URL
ARG VITE_GROUP_SERVICE_URL
ARG VITE_REQUIREMENT_SERVICE_URL
ARG VITE_TASK_SERVICE_URL
ARG VITE_REPORT_SERVICE_URL
ARG VITE_NOTIFICATION_SERVICE_URL
ARG VITE_GITHUB_SERVICE_URL
ARG VITE_JIRA_SERVICE_URL
ARG VITE_EXPORT_SERVICE_URL

ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL \
    VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL \
    VITE_GROUP_SERVICE_URL=$VITE_GROUP_SERVICE_URL \
    VITE_REQUIREMENT_SERVICE_URL=$VITE_REQUIREMENT_SERVICE_URL \
    VITE_TASK_SERVICE_URL=$VITE_TASK_SERVICE_URL \
    VITE_REPORT_SERVICE_URL=$VITE_REPORT_SERVICE_URL \
    VITE_NOTIFICATION_SERVICE_URL=$VITE_NOTIFICATION_SERVICE_URL \
    VITE_GITHUB_SERVICE_URL=$VITE_GITHUB_SERVICE_URL \
    VITE_JIRA_SERVICE_URL=$VITE_JIRA_SERVICE_URL \
    VITE_EXPORT_SERVICE_URL=$VITE_EXPORT_SERVICE_URL

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
