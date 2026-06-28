# Progressive Web App
#-----------------------------------------------
docker stop pwa
docker build -f Dockerfile.pwa -t pwa:latest .
docker-compose up -d
docker run -d --rm -p 8080:8080 --name pwa pwa:latest
#-----------------------------------------------
docker ps
docker logs pwa
docker stop pwa












# 1. Build the image
docker compose build

# 2. Start in development mode
docker compose up

# Or run in background:
docker compose up -d

Access the app at:
Development: http://localhost:5173
Production preview: http://localhost:4173

------------------------------------
 docker pull redhat/ubi9:latest-source

 docker pull redhat/ubi9-minimal:latest-source


