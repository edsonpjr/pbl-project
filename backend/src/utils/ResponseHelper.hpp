#pragma once
#include <string>
#include "../../third_party/httplib.h"
#include "../../third_party/json.hpp"

namespace pbl {
namespace utils {

/**
 * @brief Fábrica de respostas HTTP padronizadas em JSON.
 *
 * Garante consistência no formato de resposta da API:
 * sucesso: {"data": ..., "message": "..."}
 * erro:    {"error": "...", "message": "..."}
 */
class ResponseHelper {
public:
    /// Resposta de sucesso com dados
    static void ok(httplib::Response& res,
                   const nlohmann::json& data,
                   const std::string& message = "OK",
                   int statusCode = 200) {
        nlohmann::json body = {
            {"success", true},
            {"message", message},
            {"data",    data}
        };
        res.status = statusCode;
        res.set_content(body.dump(), "application/json");
    }

    /// Resposta de sucesso sem corpo (ex: 204 No Content)
    static void noContent(httplib::Response& res) {
        res.status = 204;
    }

    /// Resposta de criação (201 Created)
    static void created(httplib::Response& res,
                        const nlohmann::json& data,
                        const std::string& message = "Criado com sucesso") {
        ok(res, data, message, 201);
    }

    /// Resposta de erro genérico
    static void error(httplib::Response& res,
                      const std::string& message,
                      int statusCode = 400) {
        nlohmann::json body = {
            {"success", false},
            {"error",   httpStatusText(statusCode)},
            {"message", message}
        };
        res.status = statusCode;
        res.set_content(body.dump(), "application/json");
    }

    /// 400 Bad Request
    static void badRequest(httplib::Response& res,
                           const std::string& msg = "Requisição inválida") {
        error(res, msg, 400);
    }

    /// 401 Unauthorized
    static void unauthorized(httplib::Response& res,
                             const std::string& msg = "Não autorizado") {
        error(res, msg, 401);
    }

    /// 403 Forbidden
    static void forbidden(httplib::Response& res,
                          const std::string& msg = "Acesso negado") {
        error(res, msg, 403);
    }

    /// 404 Not Found
    static void notFound(httplib::Response& res,
                         const std::string& msg = "Recurso não encontrado") {
        error(res, msg, 404);
    }

    /// 409 Conflict
    static void conflict(httplib::Response& res,
                         const std::string& msg = "Conflito de dados") {
        error(res, msg, 409);
    }

    /// 500 Internal Server Error
    static void serverError(httplib::Response& res,
                            const std::string& msg = "Erro interno do servidor") {
        error(res, msg, 500);
    }

private:
    static std::string httpStatusText(int code) {
        switch (code) {
            case 400: return "Bad Request";
            case 401: return "Unauthorized";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 409: return "Conflict";
            case 500: return "Internal Server Error";
            default:  return "Error";
        }
    }
};

} // namespace utils
} // namespace pbl
