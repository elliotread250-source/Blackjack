FROM python:3.11-alpine

# node runs tools/worker.mjs: the server replays every run with the same game code as the browser
RUN apk add --no-cache nodejs

WORKDIR /app
COPY . /app

ENV PYTHONUNBUFFERED=1
EXPOSE 8080

CMD ["python", "server.py"]
