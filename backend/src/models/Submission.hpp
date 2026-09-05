#pragma once
#include <string>

namespace pbl {
namespace models {

/**
 * @brief Registra a tentativa de resposta de um aluno a um exercício.
 *
 * Cada submissão armazena a resposta dada, se estava correta,
 * o XP ganho (0 se incorreto) e o timestamp.
 */
class Submission {
public:
    Submission() = default;

    Submission(int id, int userId, int exerciseId,
               std::string userAnswer, bool isCorrect,
               int xpEarned, std::string submittedAt = "")
        : id_(id), userId_(userId), exerciseId_(exerciseId),
          userAnswer_(std::move(userAnswer)), isCorrect_(isCorrect),
          xpEarned_(xpEarned), submittedAt_(std::move(submittedAt)) {}

    // Getters
    int         getId()          const { return id_; }
    int         getUserId()      const { return userId_; }
    int         getExerciseId()  const { return exerciseId_; }
    std::string getUserAnswer()  const { return userAnswer_; }
    bool        getIsCorrect()   const { return isCorrect_; }
    int         getXpEarned()    const { return xpEarned_; }
    std::string getSubmittedAt() const { return submittedAt_; }

    // Setters
    void setId(int id)                         { id_ = id; }
    void setUserId(int uid)                    { userId_ = uid; }
    void setExerciseId(int eid)                { exerciseId_ = eid; }
    void setUserAnswer(const std::string& a)   { userAnswer_ = a; }
    void setIsCorrect(bool c)                  { isCorrect_ = c; }
    void setXpEarned(int xp)                   { xpEarned_ = xp; }
    void setSubmittedAt(const std::string& t)  { submittedAt_ = t; }

private:
    int         id_          = 0;
    int         userId_      = 0;
    int         exerciseId_  = 0;
    std::string userAnswer_;
    bool        isCorrect_   = false;
    int         xpEarned_    = 0;
    std::string submittedAt_;
};

} // namespace models
} // namespace pbl
