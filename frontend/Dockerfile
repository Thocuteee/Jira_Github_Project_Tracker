FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Trình duyệt trên máy bạn gọi API tới host (auth-service map 8081)
ENV VITE_AUTH_SERVICE_URL=http://localhost:8081

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
