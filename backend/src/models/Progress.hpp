#pragma once
#include <string>

namespace pbl {
namespace models {

/**
 * @brief Registra o progresso de um aluno em um tópico específico.
 *
 * Armazena quantos exercícios foram concluídos, o total disponível,
 * o XP acumulado nesse tópico e a data da última atividade.
 */
class Progress {
public:
    Progress() = default;

    Progress(int id, int userId, int topicId,
             int completedExercises, int totalExercises,
             int xpEarned, std::string lastActivity = "")
        : id_(id), userId_(userId), topicId_(topicId),
          completedExercises_(completedExercises),
          totalExercises_(totalExercises),
          xpEarned_(xpEarned),
          lastActivity_(std::move(lastActivity)) {}

    // Getters
    int         getId()                 const { return id_; }
    int         getUserId()             const { return userId_; }
    int         getTopicId()            const { return topicId_; }
    int         getCompletedExercises() const { return completedExercises_; }
    int         getTotalExercises()     const { return totalExercises_; }
    int         getXpEarned()           const { return xpEarned_; }
    std::string getLastActivity()       const { return lastActivity_; }

    /**
     * @brief Calcula a porcentagem de conclusão do tópico.
     * @return Valor entre 0.0 e 100.0
     */
    double getCompletionPercentage() const {
        if (totalExercises_ == 0) return 0.0;
        return (static_cast<double>(completedExercises_) / totalExercises_) * 100.0;
    }

    bool isCompleted() const {
        return totalExercises_ > 0 && completedExercises_ >= totalExercises_;
    }

    // Setters
    void setId(int id)                         { id_ = id; }
    void setUserId(int uid)                    { userId_ = uid; }
    void setTopicId(int tid)                   { topicId_ = tid; }
    void setCompletedExercises(int c)          { completedExercises_ = c; }
    void setTotalExercises(int t)              { totalExercises_ = t; }
    void addXp(int xp)                         { xpEarned_ += xp; }
    void setXpEarned(int xp)                   { xpEarned_ = xp; }
    void setLastActivity(const std::string& t) { lastActivity_ = t; }

    void incrementCompleted() {
        if (completedExercises_ < totalExercises_) {
            ++completedExercises_;
        }
    }

private:
    int         id_                  = 0;
    int         userId_              = 0;
    int         topicId_             = 0;
    int         completedExercises_  = 0;
    int         totalExercises_      = 0;
    int         xpEarned_            = 0;
    std::string lastActivity_;
};

} // namespace models
} // namespace pbl
