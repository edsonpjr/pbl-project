#pragma once
#include <optional>
#include <vector>
#include <stdexcept>
#include "IRepository.hpp"
#include "../models/Module.hpp"
#include "../models/Topic.hpp"
#include "../models/Exercise.hpp"
#include "../models/Progress.hpp"
#include "../models/Submission.hpp"
#include "../db/Database.hpp"
#include "../../third_party/sqlite3.h"

namespace pbl {
namespace repositories {

// ═══════════════════════════════════════════════════════════════════════
//  ModuleRepository
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Repositório de módulos (ex: Cálculo 1, Álgebra Linear).
 */
class ModuleRepository : public IRepository<models::Module> {
public:
    explicit ModuleRepository(db::Database& db) : db_(db) {}

    std::optional<models::Module> findById(int id) override {
        auto* stmt = prepare("SELECT id,title,description,order_index,is_published,created_at FROM modules WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::Module> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToModule(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::Module> findAll() override {
        auto* stmt = prepare("SELECT id,title,description,order_index,is_published,created_at FROM modules ORDER BY order_index");
        std::vector<models::Module> modules;
        while (sqlite3_step(stmt) == SQLITE_ROW) modules.push_back(rowToModule(stmt));
        sqlite3_finalize(stmt);
        return modules;
    }

    std::vector<models::Module> findPublished() {
        auto* stmt = prepare("SELECT id,title,description,order_index,is_published,created_at FROM modules WHERE is_published=1 ORDER BY order_index");
        std::vector<models::Module> modules;
        while (sqlite3_step(stmt) == SQLITE_ROW) modules.push_back(rowToModule(stmt));
        sqlite3_finalize(stmt);
        return modules;
    }

    int create(const models::Module& m) override {
        auto* stmt = prepare("INSERT INTO modules(title,description,order_index,is_published) VALUES(?,?,?,?)");
        sqlite3_bind_text(stmt, 1, m.getTitle().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, m.getDescription().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 3, m.getOrderIndex());
        sqlite3_bind_int (stmt, 4, m.isPublished() ? 1 : 0);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::Module& m) override {
        auto* stmt = prepare("UPDATE modules SET title=?,description=?,order_index=?,is_published=? WHERE id=?");
        sqlite3_bind_text(stmt, 1, m.getTitle().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, m.getDescription().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 3, m.getOrderIndex());
        sqlite3_bind_int (stmt, 4, m.isPublished() ? 1 : 0);
        sqlite3_bind_int (stmt, 5, m.getId());
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    bool remove(int id) override {
        auto* stmt = prepare("DELETE FROM modules WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr) != SQLITE_OK)
            throw std::runtime_error(std::string("SQL error: ") + sqlite3_errmsg(db_.get()));
        return stmt;
    }

    static models::Module rowToModule(sqlite3_stmt* stmt) {
        models::Module m;
        m.setId(sqlite3_column_int(stmt, 0));
        m.setTitle(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)));
        m.setDescription(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2)));
        m.setOrderIndex(sqlite3_column_int(stmt, 3));
        m.setPublished(sqlite3_column_int(stmt, 4) != 0);
        auto t = sqlite3_column_text(stmt, 5);
        if (t) m.setCreatedAt(reinterpret_cast<const char*>(t));
        return m;
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  TopicRepository
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Repositório de tópicos dentro de um módulo.
 */
class TopicRepository : public IRepository<models::Topic> {
public:
    explicit TopicRepository(db::Database& db) : db_(db) {}

    std::optional<models::Topic> findById(int id) override {
        auto* stmt = prepare("SELECT id,module_id,title,content,theory,order_index,is_published,created_at FROM topics WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::Topic> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToTopic(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::Topic> findAll() override {
        auto* stmt = prepare("SELECT id,module_id,title,content,theory,order_index,is_published,created_at FROM topics ORDER BY order_index");
        std::vector<models::Topic> topics;
        while (sqlite3_step(stmt) == SQLITE_ROW) topics.push_back(rowToTopic(stmt));
        sqlite3_finalize(stmt);
        return topics;
    }

    std::vector<models::Topic> findByModule(int moduleId) {
        auto* stmt = prepare("SELECT id,module_id,title,content,theory,order_index,is_published,created_at FROM topics WHERE module_id=? ORDER BY order_index");
        sqlite3_bind_int(stmt, 1, moduleId);
        std::vector<models::Topic> topics;
        while (sqlite3_step(stmt) == SQLITE_ROW) topics.push_back(rowToTopic(stmt));
        sqlite3_finalize(stmt);
        return topics;
    }

    std::vector<models::Topic> findPublishedByModule(int moduleId) {
        auto* stmt = prepare("SELECT id,module_id,title,content,theory,order_index,is_published,created_at FROM topics WHERE module_id=? AND is_published=1 ORDER BY order_index");
        sqlite3_bind_int(stmt, 1, moduleId);
        std::vector<models::Topic> topics;
        while (sqlite3_step(stmt) == SQLITE_ROW) topics.push_back(rowToTopic(stmt));
        sqlite3_finalize(stmt);
        return topics;
    }

    int create(const models::Topic& t) override {
        auto* stmt = prepare("INSERT INTO topics(module_id,title,content,theory,order_index,is_published) VALUES(?,?,?,?,?,?)");
        sqlite3_bind_int (stmt, 1, t.getModuleId());
        sqlite3_bind_text(stmt, 2, t.getTitle().c_str(),   -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, t.getContent().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, t.getTheory().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 5, t.getOrderIndex());
        sqlite3_bind_int (stmt, 6, t.isPublished() ? 1 : 0);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::Topic& t) override {
        auto* stmt = prepare("UPDATE topics SET module_id=?,title=?,content=?,theory=?,order_index=?,is_published=? WHERE id=?");
        sqlite3_bind_int (stmt, 1, t.getModuleId());
        sqlite3_bind_text(stmt, 2, t.getTitle().c_str(),   -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, t.getContent().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, t.getTheory().c_str(),  -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 5, t.getOrderIndex());
        sqlite3_bind_int (stmt, 6, t.isPublished() ? 1 : 0);
        sqlite3_bind_int (stmt, 7, t.getId());
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    bool remove(int id) override {
        auto* stmt = prepare("DELETE FROM topics WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr) != SQLITE_OK)
            throw std::runtime_error(std::string("SQL error: ") + sqlite3_errmsg(db_.get()));
        return stmt;
    }

    static models::Topic rowToTopic(sqlite3_stmt* stmt) {
        models::Topic t;
        t.setId(sqlite3_column_int(stmt, 0));
        t.setModuleId(sqlite3_column_int(stmt, 1));
        t.setTitle(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2)));
        auto content = sqlite3_column_text(stmt, 3);
        t.setContent(content ? reinterpret_cast<const char*>(content) : "");
        auto theory = sqlite3_column_text(stmt, 4);
        t.setTheory(theory ? reinterpret_cast<const char*>(theory) : "");
        t.setOrderIndex(sqlite3_column_int(stmt, 5));
        t.setPublished(sqlite3_column_int(stmt, 6) != 0);
        auto ct = sqlite3_column_text(stmt, 7);
        if (ct) t.setCreatedAt(reinterpret_cast<const char*>(ct));
        return t;
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  ExerciseRepository
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Repositório de exercícios associados a tópicos.
 */
class ExerciseRepository : public IRepository<models::Exercise> {
public:
    explicit ExerciseRepository(db::Database& db) : db_(db) {}

    std::optional<models::Exercise> findById(int id) override {
        auto* stmt = prepare("SELECT id,topic_id,type,question,hint,correct_answer,options,tolerance,xp_reward,order_index,created_at FROM exercises WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::Exercise> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToExercise(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::Exercise> findAll() override {
        auto* stmt = prepare("SELECT id,topic_id,type,question,hint,correct_answer,options,tolerance,xp_reward,order_index,created_at FROM exercises ORDER BY order_index");
        std::vector<models::Exercise> ex;
        while (sqlite3_step(stmt) == SQLITE_ROW) ex.push_back(rowToExercise(stmt));
        sqlite3_finalize(stmt);
        return ex;
    }

    std::vector<models::Exercise> findByTopic(int topicId) {
        auto* stmt = prepare("SELECT id,topic_id,type,question,hint,correct_answer,options,tolerance,xp_reward,order_index,created_at FROM exercises WHERE topic_id=? ORDER BY order_index");
        sqlite3_bind_int(stmt, 1, topicId);
        std::vector<models::Exercise> ex;
        while (sqlite3_step(stmt) == SQLITE_ROW) ex.push_back(rowToExercise(stmt));
        sqlite3_finalize(stmt);
        return ex;
    }

    int countByTopic(int topicId) {
        auto* stmt = prepare("SELECT COUNT(*) FROM exercises WHERE topic_id=?");
        sqlite3_bind_int(stmt, 1, topicId);
        int count = 0;
        if (sqlite3_step(stmt) == SQLITE_ROW) count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
        return count;
    }

    int create(const models::Exercise& e) override {
        auto* stmt = prepare("INSERT INTO exercises(topic_id,type,question,hint,correct_answer,options,tolerance,xp_reward,order_index) VALUES(?,?,?,?,?,?,?,?,?)");
        sqlite3_bind_int   (stmt, 1, e.getTopicId());
        sqlite3_bind_text  (stmt, 2, models::exerciseTypeToString(e.getType()).c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 3, e.getQuestion().c_str(),      -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 4, e.getHint().c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 5, e.getCorrectAnswer().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 6, e.getOptions().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 7, e.getTolerance());
        sqlite3_bind_int   (stmt, 8, e.getXpReward());
        sqlite3_bind_int   (stmt, 9, e.getOrderIndex());
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::Exercise& e) override {
        auto* stmt = prepare("UPDATE exercises SET topic_id=?,type=?,question=?,hint=?,correct_answer=?,options=?,tolerance=?,xp_reward=?,order_index=? WHERE id=?");
        sqlite3_bind_int   (stmt, 1,  e.getTopicId());
        sqlite3_bind_text  (stmt, 2,  models::exerciseTypeToString(e.getType()).c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 3,  e.getQuestion().c_str(),      -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 4,  e.getHint().c_str(),          -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 5,  e.getCorrectAnswer().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text  (stmt, 6,  e.getOptions().c_str(),       -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 7,  e.getTolerance());
        sqlite3_bind_int   (stmt, 8,  e.getXpReward());
        sqlite3_bind_int   (stmt, 9,  e.getOrderIndex());
        sqlite3_bind_int   (stmt, 10, e.getId());
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    bool remove(int id) override {
        auto* stmt = prepare("DELETE FROM exercises WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr) != SQLITE_OK)
            throw std::runtime_error(std::string("SQL error: ") + sqlite3_errmsg(db_.get()));
        return stmt;
    }

    static models::Exercise rowToExercise(sqlite3_stmt* stmt) {
        models::Exercise e;
        e.setId(sqlite3_column_int(stmt, 0));
        e.setTopicId(sqlite3_column_int(stmt, 1));
        e.setType(models::exerciseTypeFromString(
            reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2))));
        e.setQuestion(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3)));
        auto hint = sqlite3_column_text(stmt, 4);
        e.setHint(hint ? reinterpret_cast<const char*>(hint) : "");
        e.setCorrectAnswer(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5)));
        auto opts = sqlite3_column_text(stmt, 6);
        e.setOptions(opts ? reinterpret_cast<const char*>(opts) : "[]");
        e.setTolerance(sqlite3_column_double(stmt, 7));
        e.setXpReward(sqlite3_column_int(stmt, 8));
        e.setOrderIndex(sqlite3_column_int(stmt, 9));
        auto ct = sqlite3_column_text(stmt, 10);
        if (ct) e.setCreatedAt(reinterpret_cast<const char*>(ct));
        return e;
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  ProgressRepository
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Repositório de progresso do aluno por tópico.
 */
class ProgressRepository : public IRepository<models::Progress> {
public:
    explicit ProgressRepository(db::Database& db) : db_(db) {}

    std::optional<models::Progress> findById(int id) override {
        auto* stmt = prepare("SELECT id,user_id,topic_id,completed_exercises,total_exercises,xp_earned,last_activity FROM progress WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::Progress> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToProgress(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::Progress> findAll() override {
        auto* stmt = prepare("SELECT id,user_id,topic_id,completed_exercises,total_exercises,xp_earned,last_activity FROM progress");
        std::vector<models::Progress> progs;
        while (sqlite3_step(stmt) == SQLITE_ROW) progs.push_back(rowToProgress(stmt));
        sqlite3_finalize(stmt);
        return progs;
    }

    std::vector<models::Progress> findByUser(int userId) {
        auto* stmt = prepare("SELECT id,user_id,topic_id,completed_exercises,total_exercises,xp_earned,last_activity FROM progress WHERE user_id=?");
        sqlite3_bind_int(stmt, 1, userId);
        std::vector<models::Progress> progs;
        while (sqlite3_step(stmt) == SQLITE_ROW) progs.push_back(rowToProgress(stmt));
        sqlite3_finalize(stmt);
        return progs;
    }

    std::optional<models::Progress> findByUserAndTopic(int userId, int topicId) {
        auto* stmt = prepare("SELECT id,user_id,topic_id,completed_exercises,total_exercises,xp_earned,last_activity FROM progress WHERE user_id=? AND topic_id=?");
        sqlite3_bind_int(stmt, 1, userId);
        sqlite3_bind_int(stmt, 2, topicId);
        std::optional<models::Progress> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToProgress(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    int create(const models::Progress& p) override {
        auto* stmt = prepare("INSERT OR IGNORE INTO progress(user_id,topic_id,completed_exercises,total_exercises,xp_earned) VALUES(?,?,?,?,?)");
        sqlite3_bind_int(stmt, 1, p.getUserId());
        sqlite3_bind_int(stmt, 2, p.getTopicId());
        sqlite3_bind_int(stmt, 3, p.getCompletedExercises());
        sqlite3_bind_int(stmt, 4, p.getTotalExercises());
        sqlite3_bind_int(stmt, 5, p.getXpEarned());
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::Progress& p) override {
        auto* stmt = prepare("UPDATE progress SET completed_exercises=?,total_exercises=?,xp_earned=?,last_activity=datetime('now') WHERE id=?");
        sqlite3_bind_int(stmt, 1, p.getCompletedExercises());
        sqlite3_bind_int(stmt, 2, p.getTotalExercises());
        sqlite3_bind_int(stmt, 3, p.getXpEarned());
        sqlite3_bind_int(stmt, 4, p.getId());
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

    bool remove(int id) override {
        auto* stmt = prepare("DELETE FROM progress WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr) != SQLITE_OK)
            throw std::runtime_error(std::string("SQL error: ") + sqlite3_errmsg(db_.get()));
        return stmt;
    }

    static models::Progress rowToProgress(sqlite3_stmt* stmt) {
        models::Progress p;
        p.setId(sqlite3_column_int(stmt, 0));
        p.setUserId(sqlite3_column_int(stmt, 1));
        p.setTopicId(sqlite3_column_int(stmt, 2));
        p.setCompletedExercises(sqlite3_column_int(stmt, 3));
        p.setTotalExercises(sqlite3_column_int(stmt, 4));
        p.setXpEarned(sqlite3_column_int(stmt, 5));
        auto la = sqlite3_column_text(stmt, 6);
        if (la) p.setLastActivity(reinterpret_cast<const char*>(la));
        return p;
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  SubmissionRepository
// ═══════════════════════════════════════════════════════════════════════

/**
 * @brief Repositório de submissões (tentativas de resposta).
 */
class SubmissionRepository : public IRepository<models::Submission> {
public:
    explicit SubmissionRepository(db::Database& db) : db_(db) {}

    std::optional<models::Submission> findById(int id) override {
        auto* stmt = prepare("SELECT id,user_id,exercise_id,user_answer,is_correct,xp_earned,submitted_at FROM submissions WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        std::optional<models::Submission> result;
        if (sqlite3_step(stmt) == SQLITE_ROW) result = rowToSubmission(stmt);
        sqlite3_finalize(stmt);
        return result;
    }

    std::vector<models::Submission> findAll() override {
        auto* stmt = prepare("SELECT id,user_id,exercise_id,user_answer,is_correct,xp_earned,submitted_at FROM submissions ORDER BY submitted_at DESC");
        std::vector<models::Submission> subs;
        while (sqlite3_step(stmt) == SQLITE_ROW) subs.push_back(rowToSubmission(stmt));
        sqlite3_finalize(stmt);
        return subs;
    }

    std::vector<models::Submission> findByUser(int userId) {
        auto* stmt = prepare("SELECT id,user_id,exercise_id,user_answer,is_correct,xp_earned,submitted_at FROM submissions WHERE user_id=? ORDER BY submitted_at DESC");
        sqlite3_bind_int(stmt, 1, userId);
        std::vector<models::Submission> subs;
        while (sqlite3_step(stmt) == SQLITE_ROW) subs.push_back(rowToSubmission(stmt));
        sqlite3_finalize(stmt);
        return subs;
    }

    /// Verifica se o usuário já respondeu corretamente um exercício
    bool hasCorrectSubmission(int userId, int exerciseId) {
        auto* stmt = prepare("SELECT COUNT(*) FROM submissions WHERE user_id=? AND exercise_id=? AND is_correct=1");
        sqlite3_bind_int(stmt, 1, userId);
        sqlite3_bind_int(stmt, 2, exerciseId);
        int count = 0;
        if (sqlite3_step(stmt) == SQLITE_ROW) count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
        return count > 0;
    }

    int create(const models::Submission& s) override {
        auto* stmt = prepare("INSERT INTO submissions(user_id,exercise_id,user_answer,is_correct,xp_earned) VALUES(?,?,?,?,?)");
        sqlite3_bind_int (stmt, 1, s.getUserId());
        sqlite3_bind_int (stmt, 2, s.getExerciseId());
        sqlite3_bind_text(stmt, 3, s.getUserAnswer().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int (stmt, 4, s.getIsCorrect() ? 1 : 0);
        sqlite3_bind_int (stmt, 5, s.getXpEarned());
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
        return static_cast<int>(sqlite3_last_insert_rowid(db_.get()));
    }

    bool update(const models::Submission&) override { return false; } // imutável
    bool remove(int id) override {
        auto* stmt = prepare("DELETE FROM submissions WHERE id=?");
        sqlite3_bind_int(stmt, 1, id);
        sqlite3_step(stmt);
        bool ok = sqlite3_changes(db_.get()) > 0;
        sqlite3_finalize(stmt);
        return ok;
    }

private:
    db::Database& db_;

    sqlite3_stmt* prepare(const char* sql) {
        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db_.get(), sql, -1, &stmt, nullptr) != SQLITE_OK)
            throw std::runtime_error(std::string("SQL error: ") + sqlite3_errmsg(db_.get()));
        return stmt;
    }

    static models::Submission rowToSubmission(sqlite3_stmt* stmt) {
        models::Submission s;
        s.setId(sqlite3_column_int(stmt, 0));
        s.setUserId(sqlite3_column_int(stmt, 1));
        s.setExerciseId(sqlite3_column_int(stmt, 2));
        s.setUserAnswer(reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3)));
        s.setIsCorrect(sqlite3_column_int(stmt, 4) != 0);
        s.setXpEarned(sqlite3_column_int(stmt, 5));
        auto sa = sqlite3_column_text(stmt, 6);
        if (sa) s.setSubmittedAt(reinterpret_cast<const char*>(sa));
        return s;
    }
};

} // namespace repositories
} // namespace pbl
