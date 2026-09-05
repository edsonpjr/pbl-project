#pragma once
#include "../../third_party/httplib.h"
#include "../../third_party/json.hpp"
#include "../repositories/UserRepository.hpp"
#include "../repositories/Repositories.hpp"
#include "../utils/ResponseHelper.hpp"
#include "../utils/PasswordUtil.hpp"
#include "../middleware/AuthMiddleware.hpp"

namespace pbl {
namespace controllers {

// ═══════════════════════════════════════════════════════════════════════
//  UserController
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Controller de gerenciamento de usuários.
 *
 * Rotas:
 *   GET    /api/users           - lista todos (professor)
 *   GET    /api/users/:id       - busca por ID (auth)
 *   PUT    /api/users/:id       - atualiza perfil (auth, próprio)
 *   DELETE /api/users/:id       - remove (professor)
 *   GET    /api/users/ranking   - top alunos por XP (auth)
 */
class UserController {
public:
    explicit UserController(repositories::UserRepository& repo) : repo_(repo) {}

    void getAll(const httplib::Request&, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") {
            utils::ResponseHelper::forbidden(res);
            return;
        }
        auto users = repo_.findAll();
        nlohmann::json arr = nlohmann::json::array();
        for (auto& u : users) arr.push_back(toJson(u));
        utils::ResponseHelper::ok(res, arr);
    }

    void getById(const httplib::Request& req, httplib::Response& res,
                 const middleware::AuthClaims& claims) {
        int id = std::stoi(req.path_params.at("id"));
        // Alunos só podem ver o próprio perfil
        if (claims.role != "professor" && claims.userId != id) {
            utils::ResponseHelper::forbidden(res);
            return;
        }
        auto userOpt = repo_.findById(id);
        if (!userOpt) { utils::ResponseHelper::notFound(res, "Usuário não encontrado"); return; }
        utils::ResponseHelper::ok(res, toJson(*userOpt));
    }

    void update(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        int id = std::stoi(req.path_params.at("id"));
        if (claims.role != "professor" && claims.userId != id) {
            utils::ResponseHelper::forbidden(res);
            return;
        }
        auto userOpt = repo_.findById(id);
        if (!userOpt) { utils::ResponseHelper::notFound(res, "Usuário não encontrado"); return; }

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        auto user = *userOpt;
        if (body.contains("name"))  user.setName(body["name"].get<std::string>());
        if (body.contains("email")) user.setEmail(body["email"].get<std::string>());
        if (body.contains("password")) {
            std::string pw = body["password"].get<std::string>();
            if (pw.size() < 6) { utils::ResponseHelper::badRequest(res, "Senha mínima: 6 chars"); return; }
            repo_.updatePassword(id, utils::PasswordUtil::hash(pw));
        }

        repo_.update(user);
        utils::ResponseHelper::ok(res, toJson(user), "Perfil atualizado");
    }

    void remove(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") {
            utils::ResponseHelper::forbidden(res);
            return;
        }
        int id = std::stoi(req.path_params.at("id"));
        if (repo_.remove(id)) utils::ResponseHelper::ok(res, nullptr, "Usuário removido");
        else utils::ResponseHelper::notFound(res, "Usuário não encontrado");
    }

    void getRanking(const httplib::Request& req, httplib::Response& res) {
        int limit = 10;
        if (req.has_param("limit")) limit = std::stoi(req.get_param_value("limit"));
        auto users = repo_.getRanking(limit);
        nlohmann::json arr = nlohmann::json::array();
        int rank = 1;
        for (auto& u : users) {
            auto j = toJson(u);
            j["rank"] = rank++;
            arr.push_back(j);
        }
        utils::ResponseHelper::ok(res, arr);
    }

private:
    repositories::UserRepository& repo_;

    static nlohmann::json toJson(const models::User& u) {
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

// ═══════════════════════════════════════════════════════════════════════
//  ModuleController
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Controller de módulos de disciplina.
 *
 * Rotas:
 *   GET    /api/modules          - lista publicados (auth)
 *   GET    /api/modules/all      - lista todos (professor)
 *   GET    /api/modules/:id      - busca por ID (auth)
 *   POST   /api/modules          - cria (professor)
 *   PUT    /api/modules/:id      - atualiza (professor)
 *   DELETE /api/modules/:id      - remove (professor)
 */
class ModuleController {
public:
    explicit ModuleController(repositories::ModuleRepository& repo) : repo_(repo) {}

    void getPublished(const httplib::Request&, httplib::Response& res) {
        auto modules = repo_.findPublished();
        nlohmann::json arr = nlohmann::json::array();
        for (auto& m : modules) arr.push_back(toJson(m));
        utils::ResponseHelper::ok(res, arr);
    }

    void getAll(const httplib::Request&, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") {
            utils::ResponseHelper::forbidden(res);
            return;
        }
        auto modules = repo_.findAll();
        nlohmann::json arr = nlohmann::json::array();
        for (auto& m : modules) arr.push_back(toJson(m));
        utils::ResponseHelper::ok(res, arr);
    }

    void getById(const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Módulo não encontrado"); return; }
        utils::ResponseHelper::ok(res, toJson(*opt));
    }

    void create(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        if (!body.contains("title")) {
            utils::ResponseHelper::badRequest(res, "Campo obrigatório: title");
            return;
        }
        models::Module m;
        m.setTitle(body["title"].get<std::string>());
        m.setDescription(body.value("description", ""));
        m.setOrderIndex(body.value("order_index", 0));
        m.setPublished(body.value("is_published", false));

        int id = repo_.create(m);
        m.setId(id);
        utils::ResponseHelper::created(res, toJson(m), "Módulo criado");
    }

    void update(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Módulo não encontrado"); return; }

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        auto m = *opt;
        if (body.contains("title"))        m.setTitle(body["title"].get<std::string>());
        if (body.contains("description"))  m.setDescription(body["description"].get<std::string>());
        if (body.contains("order_index"))  m.setOrderIndex(body["order_index"].get<int>());
        if (body.contains("is_published")) m.setPublished(body["is_published"].get<bool>());

        repo_.update(m);
        utils::ResponseHelper::ok(res, toJson(m), "Módulo atualizado");
    }

    void remove(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        if (repo_.remove(id)) utils::ResponseHelper::ok(res, nullptr, "Módulo removido");
        else utils::ResponseHelper::notFound(res, "Módulo não encontrado");
    }

private:
    repositories::ModuleRepository& repo_;

    static nlohmann::json toJson(const models::Module& m) {
        return {
            {"id",           m.getId()},
            {"title",        m.getTitle()},
            {"description",  m.getDescription()},
            {"order_index",  m.getOrderIndex()},
            {"is_published", m.isPublished()},
            {"created_at",   m.getCreatedAt()}
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  TopicController
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Controller de tópicos dentro de módulos.
 *
 * Rotas:
 *   GET    /api/modules/:moduleId/topics     - lista tópicos publicados
 *   GET    /api/topics/:id                   - busca por ID
 *   POST   /api/modules/:moduleId/topics     - cria (professor)
 *   PUT    /api/topics/:id                   - atualiza (professor)
 *   DELETE /api/topics/:id                   - remove (professor)
 */
class TopicController {
public:
    explicit TopicController(repositories::TopicRepository& repo) : repo_(repo) {}

    void getByModule(const httplib::Request& req, httplib::Response& res,
                     const middleware::AuthClaims& claims) {
        int moduleId = std::stoi(req.path_params.at("moduleId"));
        std::vector<models::Topic> topics;
        if (claims.role == "professor") {
            topics = repo_.findByModule(moduleId);
        } else {
            topics = repo_.findPublishedByModule(moduleId);
        }
        nlohmann::json arr = nlohmann::json::array();
        for (auto& t : topics) arr.push_back(toJson(t));
        utils::ResponseHelper::ok(res, arr);
    }

    void getById(const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Tópico não encontrado"); return; }
        utils::ResponseHelper::ok(res, toJson(*opt));
    }

    void create(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int moduleId = std::stoi(req.path_params.at("moduleId"));

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        if (!body.contains("title")) {
            utils::ResponseHelper::badRequest(res, "Campo obrigatório: title");
            return;
        }
        models::Topic t;
        t.setModuleId(moduleId);
        t.setTitle(body["title"].get<std::string>());
        t.setContent(body.value("content", ""));
        t.setTheory(body.value("theory", ""));
        t.setOrderIndex(body.value("order_index", 0));
        t.setPublished(body.value("is_published", false));

        int id = repo_.create(t);
        t.setId(id);
        utils::ResponseHelper::created(res, toJson(t), "Tópico criado");
    }

    void update(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Tópico não encontrado"); return; }

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        auto t = *opt;
        if (body.contains("title"))        t.setTitle(body["title"].get<std::string>());
        if (body.contains("content"))      t.setContent(body["content"].get<std::string>());
        if (body.contains("theory"))       t.setTheory(body["theory"].get<std::string>());
        if (body.contains("order_index"))  t.setOrderIndex(body["order_index"].get<int>());
        if (body.contains("is_published")) t.setPublished(body["is_published"].get<bool>());

        repo_.update(t);
        utils::ResponseHelper::ok(res, toJson(t), "Tópico atualizado");
    }

    void remove(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        if (repo_.remove(id)) utils::ResponseHelper::ok(res, nullptr, "Tópico removido");
        else utils::ResponseHelper::notFound(res, "Tópico não encontrado");
    }

private:
    repositories::TopicRepository& repo_;

    static nlohmann::json toJson(const models::Topic& t) {
        return {
            {"id",           t.getId()},
            {"module_id",    t.getModuleId()},
            {"title",        t.getTitle()},
            {"content",      t.getContent()},
            {"theory",       t.getTheory()},
            {"order_index",  t.getOrderIndex()},
            {"is_published", t.isPublished()},
            {"created_at",   t.getCreatedAt()}
        };
    }
};

} // namespace controllers
} // namespace pbl
