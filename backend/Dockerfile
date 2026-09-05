# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    g++ gcc make \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY src/         ./src/
COPY third_party/ ./third_party/

# Compilar sqlite3 como C puro (melhor compatibilidade)
RUN gcc -std=c99 -O2 -DSQLITE_THREADSAFE=1 \
    -c third_party/sqlite3.c -o third_party/sqlite3.o

# Compilar backend C++
RUN g++ -std=c++17 -O2 -Wall \
    -I./third_party \
    -I./src \
    src/main.cpp \
    third_party/sqlite3.o \
    -lpthread -lcrypto -lssl \
    -o pbl-backend \
    && echo "Build OK"

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libssl3 wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /data

COPY --from=builder /app/pbl-backend ./pbl-backend

EXPOSE 8080

ENV PORT=8080
ENV JWT_SECRET=change-this-in-production

CMD ["./pbl-backend"]
