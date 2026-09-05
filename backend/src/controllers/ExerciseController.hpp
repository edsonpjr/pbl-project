#pragma once
#include "../../third_party/httplib.h"
#include "../../third_party/json.hpp"
#include "../repositories/Repositories.hpp"
#include "../repositories/UserRepository.hpp"
#include "../utils/ResponseHelper.hpp"
#include "../middleware/AuthMiddleware.hpp"

namespace pbl {
namespace controllers {

// ═══════════════════════════════════════════════════════════════════════
//  ExerciseController
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Controller de exercícios PBL.
 *
 * Rotas:
 *   GET    /api/topics/:topicId/exercises   - lista exercícios do tópico
 *   GET    /api/exercises/:id               - busca por ID
 *   POST   /api/topics/:topicId/exercises   - cria (professor)
 *   PUT    /api/exercises/:id               - atualiza (professor)
 *   DELETE /api/exercises/:id               - remove (professor)
 */
class ExerciseController {
public:
    explicit ExerciseController(repositories::ExerciseRepository& repo)
        : repo_(repo) {}

    void getByTopic(const httplib::Request& req, httplib::Response& res,
                    const middleware::AuthClaims& claims) {
        int topicId = std::stoi(req.path_params.at("topicId"));
        auto exercises = repo_.findByTopic(topicId);
        nlohmann::json arr = nlohmann::json::array();
        for (auto& e : exercises) {
            // Alunos não recebem a resposta correta
            arr.push_back(toJson(e, claims.role == "professor"));
        }
        utils::ResponseHelper::ok(res, arr);
    }

    void getById(const httplib::Request& req, httplib::Response& res,
                 const middleware::AuthClaims& claims) {
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Exercício não encontrado"); return; }
        utils::ResponseHelper::ok(res, toJson(*opt, claims.role == "professor"));
    }

    void create(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int topicId = std::stoi(req.path_params.at("topicId"));

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        if (!body.contains("question") || !body.contains("correct_answer")) {
            utils::ResponseHelper::badRequest(res, "Campos obrigatórios: question, correct_answer");
            return;
        }

        models::Exercise e;
        e.setTopicId(topicId);
        e.setType(models::exerciseTypeFromString(body.value("type", "multiple_choice")));
        e.setQuestion(body["question"].get<std::string>());
        e.setHint(body.value("hint", ""));
        e.setCorrectAnswer(body["correct_answer"].get<std::string>());
        e.setTolerance(body.value("tolerance", 0.001));
        e.setXpReward(body.value("xp_reward", 10));
        e.setOrderIndex(body.value("order_index", 0));

        // Opções para múltipla escolha
        if (body.contains("options") && body["options"].is_array()) {
            e.setOptions(body["options"].dump());
        } else {
            e.setOptions("[]");
        }

        int id = repo_.create(e);
        e.setId(id);
        utils::ResponseHelper::created(res, toJson(e, true), "Exercício criado");
    }

    void update(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        auto opt = repo_.findById(id);
        if (!opt) { utils::ResponseHelper::notFound(res, "Exercício não encontrado"); return; }

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        auto e = *opt;
        if (body.contains("question"))       e.setQuestion(body["question"].get<std::string>());
        if (body.contains("hint"))           e.setHint(body["hint"].get<std::string>());
        if (body.contains("correct_answer")) e.setCorrectAnswer(body["correct_answer"].get<std::string>());
        if (body.contains("tolerance"))      e.setTolerance(body["tolerance"].get<double>());
        if (body.contains("xp_reward"))      e.setXpReward(body["xp_reward"].get<int>());
        if (body.contains("order_index"))    e.setOrderIndex(body["order_index"].get<int>());
        if (body.contains("type"))           e.setType(models::exerciseTypeFromString(body["type"].get<std::string>()));
        if (body.contains("options") && body["options"].is_array()) {
            e.setOptions(body["options"].dump());
        }

        repo_.update(e);
        utils::ResponseHelper::ok(res, toJson(e, true), "Exercício atualizado");
    }

    void remove(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        if (claims.role != "professor") { utils::ResponseHelper::forbidden(res); return; }
        int id = std::stoi(req.path_params.at("id"));
        if (repo_.remove(id)) utils::ResponseHelper::ok(res, nullptr, "Exercício removido");
        else utils::ResponseHelper::notFound(res, "Exercício não encontrado");
    }

private:
    repositories::ExerciseRepository& repo_;

    static nlohmann::json toJson(const models::Exercise& e, bool includeAnswer) {
        nlohmann::json j = {
            {"id",          e.getId()},
            {"topic_id",    e.getTopicId()},
            {"type",        models::exerciseTypeToString(e.getType())},
            {"question",    e.getQuestion()},
            {"hint",        e.getHint()},
            {"xp_reward",   e.getXpReward()},
            {"order_index", e.getOrderIndex()},
            {"tolerance",   e.getTolerance()},
            {"created_at",  e.getCreatedAt()}
        };
        // Opções em JSON
        try { j["options"] = nlohmann::json::parse(e.getOptions()); }
        catch (...) { j["options"] = nlohmann::json::array(); }

        if (includeAnswer) j["correct_answer"] = e.getCorrectAnswer();
        return j;
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  SubmissionController
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Controller de submissões de exercícios (lógica PBL central).
 *
 * Responsável por:
 * - Receber a resposta do aluno
 * - Verificar se está correta
 * - Atualizar XP do usuário e progresso
 *
 * Rotas:
 *   POST /api/exercises/:exerciseId/submit  - submete resposta (aluno)
 *   GET  /api/submissions/me               - histórico do aluno
 *   GET  /api/progress/me                  - progresso do aluno
 *   GET  /api/progress/me/:topicId         - progresso em tópico específico
 */
class SubmissionController {
public:
    SubmissionController(repositories::SubmissionRepository& subRepo,
                         repositories::ExerciseRepository&   exRepo,
                         repositories::ProgressRepository&   progRepo,
                         repositories::UserRepository&        userRepo)
        : subRepo_(subRepo), exRepo_(exRepo),
          progRepo_(progRepo), userRepo_(userRepo) {}

    /**
     * @brief POST /api/exercises/:exerciseId/submit
     *
     * Fluxo PBL:
     * 1. Recebe resposta do aluno
     * 2. Verifica se está correta
     * 3. Se primeira vez correta: adiciona XP ao usuário e ao progresso
     * 4. Atualiza contagem de progresso no tópico
     * 5. Retorna resultado + XP ganho + feedback
     */
    void submit(const httplib::Request& req, httplib::Response& res,
                const middleware::AuthClaims& claims) {
        int exerciseId = std::stoi(req.path_params.at("exerciseId"));

        auto exOpt = exRepo_.findById(exerciseId);
        if (!exOpt) {
            utils::ResponseHelper::notFound(res, "Exercício não encontrado");
            return;
        }

        nlohmann::json body;
        try { body = nlohmann::json::parse(req.body); }
        catch (...) { utils::ResponseHelper::badRequest(res, "JSON inválido"); return; }

        if (!body.contains("answer")) {
            utils::ResponseHelper::badRequest(res, "Campo obrigatório: answer");
            return;
        }

        const auto& exercise = *exOpt;
        std::string userAnswer = body["answer"].get<std::string>();
        bool isCorrect = exercise.checkAnswer(userAnswer);

        // XP só ganho na primeira resposta correta
        bool alreadyCorrect = subRepo_.hasCorrectSubmission(claims.userId, exerciseId);
        int xpEarned = (isCorrect && !alreadyCorrect) ? exercise.getXpReward() : 0;

        // Salvar submissão
        models::Submission sub;
        sub.setUserId(claims.userId);
        sub.setExerciseId(exerciseId);
        sub.setUserAnswer(userAnswer);
        sub.setIsCorrect(isCorrect);
        sub.setXpEarned(xpEarned);
        int subId = subRepo_.create(sub);
        sub.setId(subId);

        // Atualizar XP total do usuário
        if (xpEarned > 0) {
            auto userOpt = userRepo_.findById(claims.userId);
            if (userOpt) {
                int newXp = userOpt->getXp() + xpEarned;
                userRepo_.updateXp(claims.userId, newXp);
            }
        }

        // Atualizar progresso do tópico
        if (isCorrect && !alreadyCorrect) {
            updateProgress(claims.userId, exercise.getTopicId(), xpEarned);
        }

        // Montar resposta
        nlohmann::json result = {
            {"submission_id",  subId},
            {"is_correct",     isCorrect},
            {"xp_earned",      xpEarned},
            {"already_solved", alreadyCorrect},
            {"feedback",       isCorrect
                ? "Parabéns! Resposta correta."
                : "Resposta incorreta. Tente novamente."},
            {"correct_answer", isCorrect ? exercise.getCorrectAnswer() : ""}
        };
        utils::ResponseHelper::ok(res, result);
    }

    /// Histórico de submissões do usuário logado
    void getMySubmissions(const httplib::Request&, httplib::Response& res,
                          const middleware::AuthClaims& claims) {
        auto subs = subRepo_.findByUser(claims.userId);
        nlohmann::json arr = nlohmann::json::array();
        for (auto& s : subs) arr.push_back(subToJson(s));
        utils::ResponseHelper::ok(res, arr);
    }

    /// Progresso completo do aluno (todos os tópicos)
    void getMyProgress(const httplib::Request&, httplib::Response& res,
                       const middleware::AuthClaims& claims) {
        auto progs = progRepo_.findByUser(claims.userId);
        nlohmann::json arr = nlohmann::json::array();
        for (auto& p : progs) arr.push_back(progressToJson(p));
        utils::ResponseHelper::ok(res, arr);
    }

    /// Progresso em um tópico específico
    void getProgressByTopic(const httplib::Request& req, httplib::Response& res,
                            const middleware::AuthClaims& claims) {
        int topicId = std::stoi(req.path_params.at("topicId"));
        auto opt = progRepo_.findByUserAndTopic(claims.userId, topicId);
        if (!opt) {
            // Retornar progresso zerado se não iniciou
            nlohmann::json zero = {
                {"user_id",              claims.userId},
                {"topic_id",             topicId},
                {"completed_exercises",  0},
                {"total_exercises",      0},
                {"xp_earned",            0},
                {"completion_pct",       0.0}
            };
            utils::ResponseHelper::ok(res, zero);
            return;
        }
        utils::ResponseHelper::ok(res, progressToJson(*opt));
    }

private:
    repositories::SubmissionRepository& subRepo_;
    repositories::ExerciseRepository&   exRepo_;
    repositories::ProgressRepository&   progRepo_;
    repositories::UserRepository&        userRepo_;

    /**
     * @brief Atualiza ou cria o registro de progresso do aluno no tópico.
     */
    void updateProgress(int userId, int topicId, int xpEarned) {
        int total = exRepo_.countByTopic(topicId);
        auto progOpt = progRepo_.findByUserAndTopic(userId, topicId);

        if (!progOpt) {
            // Primeira vez nesse tópico
            models::Progress p;
            p.setUserId(userId);
            p.setTopicId(topicId);
            p.setCompletedExercises(1);
            p.setTotalExercises(total);
            p.setXpEarned(xpEarned);
            progRepo_.create(p);
        } else {
            auto prog = *progOpt;
            prog.incrementCompleted();
            prog.setTotalExercises(total);
            prog.addXp(xpEarned);
            progRepo_.update(prog);
        }
    }

    static nlohmann::json subToJson(const models::Submission& s) {
        return {
            {"id",           s.getId()},
            {"exercise_id",  s.getExerciseId()},
            {"user_answer",  s.getUserAnswer()},
            {"is_correct",   s.getIsCorrect()},
            {"xp_earned",    s.getXpEarned()},
            {"submitted_at", s.getSubmittedAt()}
        };
    }

    static nlohmann::json progressToJson(const models::Progress& p) {
        return {
            {"id",                   p.getId()},
            {"user_id",              p.getUserId()},
            {"topic_id",             p.getTopicId()},
            {"completed_exercises",  p.getCompletedExercises()},
            {"total_exercises",      p.getTotalExercises()},
            {"xp_earned",            p.getXpEarned()},
            {"completion_pct",       p.getCompletionPercentage()},
            {"is_completed",         p.isCompleted()},
            {"last_activity",        p.getLastActivity()}
        };
    }
};

} // namespace controllers
} // namespace pbl
