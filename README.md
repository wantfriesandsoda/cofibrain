# Progressive Web App
docker stop pwa
docker build -f Dockerfile.pwa -t pwa:latest .
docker-compose up -d
docker run -d --rm -p 8080:8080 --name pwa pwa:latest

docker ps
docker logs pwa
docker stop pwa



