#pragma once
#include <optional>
#include <vector>
#include <stdexcept>
#include "IRepository.hpp"
#include "../models/User.hpp"
#include "../db/Database.hpp"
#include "../../third_party/sqlite3.h"

namespace pbl {
namespace repositories {

/**
 * @brief Repositório de usuários com acesso ao SQLite.
 *
 * Implementa o padrão Repository para a entidade User,
 * encapsulando toda a lógica de acesso ao banco de dados.
 */
class UserRepository : public IRepository<models::User> {
public:
    explicit UserRepository(db::Database& db) : db_(db) {}

    // ─── IRepository interface ────────────────────────────────────────────

    std::optional<models::User> findById(int id) override {
        const char* sql = R"(
            SELECT id, name, email, password_hash, role, xp, created_at
            FROM users WHERE id = ?
        )";
        sqlite3_stmt* stmt = prepare(sql);

        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::User> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            result = rowToUser(stmt);
        }
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::User> findAll() override {
        const char* sql = R"(
            SELECT id, name, email, password_hash, role, xp, created_at
            FROM users ORDER BY xp DESC
        )";
        sqlite3_stmt* stmt = prepare(sql);
        std::vector<models::User> users;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            users.push_back(rowToUser(stmt));
        }
        sqlite3_finalize(stmt);
        return users;
    }

    int create(const models::User& user) override {
        const char* sql = R"(
            INSERT INTO users (name, email, password_hash, role, xp)
            VALUES (?, ?, ?, ?, ?)
        )";
        sqlite3_stmt* stmt = prepare(sql);

        sqlite3_bind_text(stmt, 1, user.getName().c_str(),         -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, user.getEmail().c_str(),        -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, user.getPasswordHash().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, models::roleToString(user.getRole()).c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 5, user.getXp());

        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::User& user) override {
        const char* sql = R"(
            UPDATE users SET name=?, email=?, role=?, xp=?
            WHERE id=?
        )";
        sqlite3_stmt* stmt = prepare(sql);

        sqlite3_bind_text(stmt, 1, user.getName().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, user.getEmail().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, models::roleToString(user.getRole()).c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 4, user.getXp());
        sqlite3_bind_int (stmt, 5, user.getId());

        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    bool remove(int id) override {
        const char* sql = "DELETE FROM users WHERE id=?";
        sqlite3_stmt* stmt = prepare(sql);
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    // ─── Queries específicas de usuário ──────────────────────────────────

    /// Busca usuário por e-mail (único)
    std::optional<models::User> findByEmail(const std::string& email) {
        const char* sql = R"(
            SELECT id, name, email, password_hash, role, xp, created_at
            FROM users WHERE email = ?
        )";
        sqlite3_stmt* stmt = prepare(sql);
        sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_TRANSIENT);

        std::optional<models::User> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            result = rowToUser(stmt);
        }
        sqlite3_finalize(stmt);
        return result;
    }

    /// Atualiza o XP de um usuário
    bool updateXp(int userId, int xp) {
        const char* sql = "UPDATE users SET xp=? WHERE id=?";
        sqlite3_stmt* stmt = prepare(sql);
        sqlite3_bind_int(stmt, 1, xp);
        sqlite3_bind_int(stmt, 2, userId);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    /// Ranking dos top N alunos por XP
    std::vector<models::User> getRanking(int limit = 10) {
        const char* sql = R"(
            SELECT id, name, email, password_hash, role, xp, created_at
            FROM users WHERE role='student'
            ORDER BY xp DESC LIMIT ?
        )";
        sqlite3_stmt* stmt = prepare(sql);
        sqlite3_bind_int(stmt, 1, limit);

        std::vector<models::User> users;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            users.push_back(rowToUser(stmt));
        }
        sqlite3_finalize(stmt);
        return users;
    }

    /// Atualiza senha do usuário
    bool updatePassword(int userId, const std::string& newHash) {
        const char* sql = "UPDATE users SET password_hash=? WHERE id=?";
        sqlite3_stmt* stmt = prepare(sql);
        sqlite3_bind_text(stmt, 1, newHash.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 2, userId);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        int rc = sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr);
        if (rc != SQLITE_OK) {
            throw std::runtime_error(std::string("Erro ao preparar SQL: ")
                                     + sqlite3_errmsg(db_.get()));
        }
        return stmt;
    }

    /// Converte uma linha do SQLite para um objeto User
    static models::User rowToUser(sqlite3_stmt* stmt) {
        models::User u;
        u.setId(sqlite3_column_int(stmt, 0));
        u.setName(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)));
        u.setEmail(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2)));
        u.setPasswordHash(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3)));
        u.setRole(models::roleFromString(
            reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4))));
        u.setXp(sqlite3_column_int(stmt, 5));
        auto created = sqlite3_column_text(stmt, 6);
        if (created) u.setCreatedAt(reinterpret_cast<const char*>(created));
        return u;
    }
};

} // namespace repositories
} // namespace pbl
