#pragma once
#include <string>
#include <stdexcept>
#include <iostream>
#include "../../third_party/sqlite3.h"

namespace pbl {
namespace db {

/**
 * @brief Gerenciador da conexão com o banco de dados SQLite.
 *
 * Implementa o padrão RAII: abre a conexão no construtor e
 * fecha automaticamente no destrutor.
 *
 * Singleton-like: utilizado via injeção de dependência nos repositories.
 */
class Database {
public:
    /**
     * @brief Abre a conexão com o banco de dados.
     * @param path Caminho para o arquivo .db (persistido via Docker volume)
     * @throws std::runtime_error se não conseguir abrir a conexão
     */
    explicit Database(const std::string& path) : db_(nullptr) {
        int rc = sqlite3_open(path.c_str(), &db_);
        if (rc != SQLITE_OK) {
            std::string err = sqlite3_errmsg(db_);
            sqlite3_close(db_);
            throw std::runtime_error("Falha ao abrir banco de dados: " + err);
        }
        // Habilitar WAL mode para melhor concorrência
        execute("PRAGMA journal_mode=WAL;");
        execute("PRAGMA foreign_keys=ON;");
        std::cout << "[DB] Conectado em: " << path << std::endl;
    }

    /// Destrutor RAII: fecha a conexão automaticamente
    ~Database() {
        if (db_) {
            sqlite3_close(db_);
            db_ = nullptr;
        }
    }

    // Non-copyable, movable
    Database(const Database&)            = delete;
    Database& operator=(const Database&) = delete;
    Database(Database&&)                 = default;
    Database& operator=(Database&&)      = default;

    /// Acesso ao ponteiro SQLite nativo (para uso nos repositories)
    sqlite3* get() const { return db_; }

    /**
     * @brief Executa um comando SQL sem retorno de linhas.
     * @throws std::runtime_error em caso de erro
     */
    void execute(const std::string& sql) {
        char* errMsg = nullptr;
        int rc = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &errMsg);
        if (rc != SQLITE_OK) {
            std::string err = errMsg ? errMsg : "Erro desconhecido";
            sqlite3_free(errMsg);
            throw std::runtime_error("Erro SQL: " + err + "\nQuery: " + sql);
        }
    }

    /**
     * @brief Inicializa o schema do banco de dados.
     *
     * Cria todas as tabelas caso não existam.
     * Idempotente: pode ser chamado múltiplas vezes com segurança.
     */
    void initSchema() {
        // Tabela de usuários
        execute(R"(
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    NOT NULL,
                email        TEXT    NOT NULL UNIQUE,
                password_hash TEXT   NOT NULL,
                role         TEXT    NOT NULL DEFAULT 'student',
                xp           INTEGER NOT NULL DEFAULT 0,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        )");

        // Tabela de módulos (ex: Cálculo 1, Álgebra Linear)
        execute(R"(
            CREATE TABLE IF NOT EXISTS modules (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                title        TEXT    NOT NULL,
                description  TEXT    NOT NULL DEFAULT '',
                order_index  INTEGER NOT NULL DEFAULT 0,
                is_published INTEGER NOT NULL DEFAULT 0,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        )");

        // Tabela de tópicos (ex: Limites, Derivadas)
        execute(R"(
            CREATE TABLE IF NOT EXISTS topics (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id    INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                title        TEXT    NOT NULL,
                content      TEXT    NOT NULL DEFAULT '',
                theory       TEXT    NOT NULL DEFAULT '',
                order_index  INTEGER NOT NULL DEFAULT 0,
                is_published INTEGER NOT NULL DEFAULT 0,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        )");

        // Tabela de exercícios
        execute(R"(
            CREATE TABLE IF NOT EXISTS exercises (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id       INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                type           TEXT    NOT NULL DEFAULT 'multiple_choice',
                question       TEXT    NOT NULL,
                hint           TEXT    NOT NULL DEFAULT '',
                correct_answer TEXT    NOT NULL,
                options        TEXT    NOT NULL DEFAULT '[]',
                tolerance      REAL    NOT NULL DEFAULT 0.001,
                xp_reward      INTEGER NOT NULL DEFAULT 10,
                order_index    INTEGER NOT NULL DEFAULT 0,
                created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        )");

        // Tabela de submissões (histórico de respostas)
        execute(R"(
            CREATE TABLE IF NOT EXISTS submissions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                exercise_id  INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
                user_answer  TEXT    NOT NULL,
                is_correct   INTEGER NOT NULL DEFAULT 0,
                xp_earned    INTEGER NOT NULL DEFAULT 0,
                submitted_at TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        )");

        // Tabela de progresso (agregado por usuário/tópico)
        execute(R"(
            CREATE TABLE IF NOT EXISTS progress (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                topic_id             INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                completed_exercises  INTEGER NOT NULL DEFAULT 0,
                total_exercises      INTEGER NOT NULL DEFAULT 0,
                xp_earned            INTEGER NOT NULL DEFAULT 0,
                last_activity        TEXT    NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, topic_id)
            );
        )");

        // Índices para performance
        execute("CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);");
        execute("CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);");
        execute("CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);");
        execute("CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);");

        std::cout << "[DB] Schema inicializado com sucesso." << std::endl;
    }

private:
    sqlite3* db_;
};

} // namespace db
} // namespace pbl
