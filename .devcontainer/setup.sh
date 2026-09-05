#!/bin/bash
# Script executado UMA vez na criação do Codespace
set -e

echo "========================================"
echo "  PBLLearn — Configuração inicial"
echo "========================================"

# ── Instalar dependências do sistema ─────────────────────────────────────────
echo ""
echo "→ Instalando dependências C++..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    g++ gcc make \
    libssl-dev \
    2>/dev/null

echo "  ✓ g++, gcc, libssl-dev instalados"

# ── Instalar dependências do frontend ────────────────────────────────────────
echo ""
echo "→ Instalando dependências Node.js..."
cd /workspaces/pbl-platform/frontend
npm install --silent
echo "  ✓ node_modules instalado"

# ── Compilar SQLite ───────────────────────────────────────────────────────────
echo ""
echo "→ Compilando SQLite amalgamation..."
cd /workspaces/pbl-platform/backend
gcc -std=c99 -O2 -DSQLITE_THREADSAFE=1 \
    -c third_party/sqlite3.c \
    -o third_party/sqlite3.o
echo "  ✓ sqlite3.o compilado"

# ── Compilar backend ──────────────────────────────────────────────────────────
echo ""
echo "→ Compilando backend C++..."
g++ -std=c++17 -O2 -Wall \
    -I./third_party \
    -I./src \
    src/main.cpp \
    third_party/sqlite3.o \
    -lpthread -lcrypto -lssl \
    -o pbl-backend
echo "  ✓ pbl-backend compilado"

# ── Criar diretório para o banco ──────────────────────────────────────────────
mkdir -p /workspaces/pbl-platform/data
echo "  ✓ diretório /data criado"

# ── Criar .env se não existir ─────────────────────────────────────────────────
cd /workspaces/pbl-platform
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  ✓ .env criado a partir de .env.example"
fi

echo ""
echo "========================================"
echo "  ✅ Setup concluído!"
echo ""
echo "  Para rodar com Docker:"
echo "    docker compose up --build -d"
echo ""
echo "  Para rodar direto (modo dev):"
echo "    bash .devcontainer/run-dev.sh"
echo "========================================"
