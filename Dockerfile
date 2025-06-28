# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Debugging steps
RUN ls -la /usr/share/nginx/html
RUN cat /etc/nginx/conf.d/default.conf
RUN nginx -t

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
