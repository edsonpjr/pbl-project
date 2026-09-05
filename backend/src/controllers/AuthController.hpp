#pragma once
#include <string>
#include "../../third_party/httplib.h"
#include "../../third_party/json.hpp"
#include "../repositories/UserRepository.hpp"
#include "../utils/JwtUtil.hpp"
#include "../utils/PasswordUtil.hpp"
#include "../utils/ResponseHelper.hpp"
#include "../middleware/AuthMiddleware.hpp"

namespace pbl {
namespace controllers {

/**
 * @brief Controller de autenticação.
 *
 * Responsável por registro (POST /auth/register)
 * e login (POST /auth/login).
 */
class AuthController {
public:
    AuthController(repositories::UserRepository& userRepo,
                   middleware::AuthMiddleware& auth)
        : userRepo_(userRepo), auth_(auth) {}

    /**
     * @brief POST /api/auth/register
     *
     * Body JSON esperado:
     * {
     *   "name": "João Silva",
     *   "email": "joao@email.com",
     *   "password": "senha123",
     *   "role": "student"   // opcional, padrão: "student"
     * }
     */
    void registerUser(const httplib::Request& req, httplib::Response& res) {
        nlohmann::json body;
        try {
            body = nlohmann::json::parse(req.body);
        } catch (...) {
            utils::ResponseHelper::badRequest(res, "JSON inválido");
            return;
        }

        // Validação dos campos obrigatórios
        if (!body.contains("name") || !body.contains("email") ||
            !body.contains("password")) {
            utils::ResponseHelper::badRequest(res, "Campos obrigatórios: name, email, password");
            return;
        }

        std::string name     = body["name"].get<std::string>();
        std::string email    = body["email"].get<std::string>();
        std::string password = body["password"].get<std::string>();
        std::string role     = body.value("role", "student");

        if (name.empty() || email.empty() || password.size() < 6) {
            utils::ResponseHelper::badRequest(res, "Dados inválidos: senha mínima de 6 caracteres");
            return;
        }

        // Verificar se e-mail já existe
        if (userRepo_.findByEmail(email)) {
            utils::ResponseHelper::conflict(res, "E-mail já cadastrado");
            return;
        }

        // Criar usuário
        models::User user;
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(utils::PasswordUtil::hash(password));
        user.setRole(models::roleFromString(role));
        user.setXp(0);

        try {
            int newId = userRepo_.create(user);
            user.setId(newId);

            std::string token = utils::JwtUtil::generate(
                newId, email, models::roleToString(user.getRole()),
                auth_.getSecret());

            nlohmann::json data = {
                {"token", token},
                {"user",  userToJson(user)}
            };
            utils::ResponseHelper::created(res, data, "Usuário registrado com sucesso");
        } catch (const std::exception& e) {
            utils::ResponseHelper::serverError(res, e.what());
        }
    }

    /**
     * @brief POST /api/auth/login
     *
     * Body JSON esperado:
     * {
     *   "email": "joao@email.com",
     *   "password": "senha123"
     * }
     */
    void login(const httplib::Request& req, httplib::Response& res) {
        nlohmann::json body;
        try {
            body = nlohmann::json::parse(req.body);
        } catch (...) {
            utils::ResponseHelper::badRequest(res, "JSON inválido");
            return;
        }

        if (!body.contains("email") || !body.contains("password")) {
            utils::ResponseHelper::badRequest(res, "Campos obrigatórios: email, password");
            return;
        }

        std::string email    = body["email"].get<std::string>();
        std::string password = body["password"].get<std::string>();

        auto userOpt = userRepo_.findByEmail(email);
        if (!userOpt) {
            utils::ResponseHelper::unauthorized(res, "Credenciais inválidas");
            return;
        }

        const auto& user = *userOpt;
        if (!utils::PasswordUtil::verify(password, user.getPasswordHash())) {
            utils::ResponseHelper::unauthorized(res, "Credenciais inválidas");
            return;
        }

        std::string token = utils::JwtUtil::generate(
            user.getId(), email,
            models::roleToString(user.getRole()),
            auth_.getSecret());

        nlohmann::json data = {
            {"token", token},
            {"user",  userToJson(user)}
        };
        utils::ResponseHelper::ok(res, data, "Login realizado com sucesso");
    }

    /**
     * @brief GET /api/auth/me
     * Retorna o perfil do usuário autenticado.
     */
    void me(const httplib::Request& req, httplib::Response& res,
            const middleware::AuthClaims& claims) {
        auto userOpt = userRepo_.findById(claims.userId);
        if (!userOpt) {
            utils::ResponseHelper::notFound(res, "Usuário não encontrado");
            return;
        }
        utils::ResponseHelper::ok(res, userToJson(*userOpt));
    }

private:
    repositories::UserRepository& userRepo_;
    middleware::AuthMiddleware&    auth_;

    static nlohmann::json userToJson(const models::User& u) {
        return {
            {"id",         u.getId()},
            {"name",       u.getName()},
            {"email",      u.getEmail()},
            {"role",       models::roleToString(u.getRole())},
            {"xp",         u.getXp()},
            {"created_at", u.getCreatedAt()}
        };
    }
};

} // namespace controllers
} // namespace pbl
