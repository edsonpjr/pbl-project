#!/bin/bash
# Roda backend + frontend em modo desenvolvimento (sem Docker)
# Útil para desenvolvimento rápido no Codespaces
set -e

REPO_ROOT="/workspaces/pbl-platform"
DATA_DIR="$REPO_ROOT/data"

echo "========================================"
echo "  PBLLearn — Modo Desenvolvimento"
echo "========================================"

# ── Verificar se o backend foi compilado ─────────────────────────────────────
if [ ! -f "$REPO_ROOT/backend/pbl-backend" ]; then
    echo "→ Backend não compilado. Compilando..."
    cd "$REPO_ROOT/backend"
    gcc -std=c99 -O2 -DSQLITE_THREADSAFE=1 \
        -c third_party/sqlite3.c \
        -o third_party/sqlite3.o
    g++ -std=c++17 -O2 -Wall \
        -I./third_party \
        -I./src \
        src/main.cpp \
        third_party/sqlite3.o \
        -lpthread -lcrypto -lssl \
        -o pbl-backend
    echo "  ✓ Compilado"
fi

mkdir -p "$DATA_DIR"

# ── Carregar .env ─────────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/.env" ]; then
    export $(grep -v '^#' "$REPO_ROOT/.env" | xargs)
fi

JWT_SECRET="${JWT_SECRET:-pbl-dev-secret}"
PORT="${PORT:-8080}"

echo ""
echo "→ Iniciando backend na porta $PORT..."
cd "$REPO_ROOT/backend"
JWT_SECRET="$JWT_SECRET" PORT="$PORT" \
    ./pbl-backend > /tmp/pbl-backend.log 2>&1 &
BACKEND_PID=$!
echo "  PID: $BACKEND_PID  |  Log: /tmp/pbl-backend.log"

# Aguardar backend subir
echo "  Aguardando backend..."
for i in $(seq 1 15); do
    if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        echo "  ✓ Backend OK"
        break
    fi
    sleep 1
done

# ── Iniciar frontend em dev mode ──────────────────────────────────────────────
echo ""
echo "→ Iniciando frontend (Vite dev server)..."
cd "$REPO_ROOT/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "  PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "  ✅ Serviços rodando!"
echo ""
echo "  Backend:  porta 8080"
echo "  Frontend: porta 5173"
echo ""
echo "  No Codespaces, abra a aba 'Ports'"
echo "  e clique na porta 5173 para acessar"
echo ""
echo "  Pressione Ctrl+C para parar tudo"
echo "========================================"

# Trap para matar ambos os processos ao sair
cleanup() {
    echo ""
    echo "→ Encerrando serviços..."
    kill $BACKEND_PID  2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "  ✓ Encerrado"
}
trap cleanup INT TERM

# Manter rodando
wait
