#pragma once
#include <string>
#include <functional>
#include <optional>
#include "../../third_party/httplib.h"
#include "../../third_party/json.hpp"
#include "../utils/JwtUtil.hpp"
#include "../utils/ResponseHelper.hpp"

namespace pbl {
namespace middleware {

/**
 * @brief Resultado da autenticação extraído do JWT.
 */
struct AuthClaims {
    int         userId;
    std::string email;
    std::string role;
};

/**
 * @brief Middleware de autenticação e autorização JWT.
 *
 * Extrai e valida o token Bearer do header Authorization.
 * Permite proteger rotas e restringir acesso por role.
 */
class AuthMiddleware {
public:
    explicit AuthMiddleware(std::string secret)
        : jwtSecret_(std::move(secret)) {}

    /**
     * @brief Extrai e valida as claims do JWT a partir do header Authorization.
     * @return AuthClaims se válido, nullopt se inválido/ausente
     */
    std::optional<AuthClaims> authenticate(const httplib::Request& req) const {
        auto it = req.headers.find("Authorization");
        if (it == req.headers.end()) return std::nullopt;

        const std::string& auth = it->second;
        const std::string prefix = "Bearer ";
        if (auth.substr(0, prefix.size()) != prefix) return std::nullopt;

        std::string token = auth.substr(prefix.size());
        try {
            auto payload = utils::JwtUtil::verify(token, jwtSecret_);
            AuthClaims claims;
            claims.userId = payload["sub"].get<int>();
            claims.email  = payload["email"].get<std::string>();
            claims.role   = payload["role"].get<std::string>();
            return claims;
        } catch (...) {
            return std::nullopt;
        }
    }

    /**
     * @brief Cria um handler que requer autenticação válida.
     * @param handler Função a ser executada se autenticado
     */
    std::function<void(const httplib::Request&, httplib::Response&)>
    requireAuth(std::function<void(const httplib::Request&,
                                   httplib::Response&,
                                   const AuthClaims&)> handler) const {
        return [this, handler](const httplib::Request& req,
                               httplib::Response& res) {
            auto claims = authenticate(req);
            if (!claims) {
                utils::ResponseHelper::unauthorized(res, "Token inválido ou ausente");
                return;
            }
            handler(req, res, *claims);
        };
    }

    /**
     * @brief Cria um handler que requer role de professor.
     */
    std::function<void(const httplib::Request&, httplib::Response&)>
    requireProfessor(std::function<void(const httplib::Request&,
                                        httplib::Response&,
                                        const AuthClaims&)> handler) const {
        return requireAuth([handler](const httplib::Request& req,
                                      httplib::Response& res,
                                      const AuthClaims& claims) {
            if (claims.role != "professor") {
                utils::ResponseHelper::forbidden(res, "Acesso restrito a professores");
                return;
            }
            handler(req, res, claims);
        });
    }

    /**
     * @brief Cria um handler que requer role de aluno.
     */
    std::function<void(const httplib::Request&, httplib::Response&)>
    requireStudent(std::function<void(const httplib::Request&,
                                       httplib::Response&,
                                       const AuthClaims&)> handler) const {
        return requireAuth([handler](const httplib::Request& req,
                                      httplib::Response& res,
                                      const AuthClaims& claims) {
            if (claims.role != "student") {
                utils::ResponseHelper::forbidden(res, "Acesso restrito a alunos");
                return;
            }
            handler(req, res, claims);
        });
    }

    const std::string& getSecret() const { return jwtSecret_; }

private:
    std::string jwtSecret_;
};

} // namespace middleware
} // namespace pbl
