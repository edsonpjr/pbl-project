#pragma once
#include <string>
#include <vector>

namespace pbl {
namespace models {

/**
 * @brief Tipos de exercícios suportados pela plataforma.
 *
 * MULTIPLE_CHOICE: questão com alternativas (A, B, C, D).
 * NUMERIC_INPUT:   questão com resposta numérica exata ou com tolerância.
 */
enum class ExerciseType {
    MULTIPLE_CHOICE,
    NUMERIC_INPUT
};

inline ExerciseType exerciseTypeFromString(const std::string& s) {
    return (s == "numeric_input") ? ExerciseType::NUMERIC_INPUT
                                  : ExerciseType::MULTIPLE_CHOICE;
}

inline std::string exerciseTypeToString(ExerciseType t) {
    return (t == ExerciseType::NUMERIC_INPUT) ? "numeric_input"
                                              : "multiple_choice";
}

/**
 * @brief Representa uma alternativa de questão de múltipla escolha.
 */
struct Choice {
    std::string label;  ///< Ex: "A", "B", "C", "D"
    std::string text;   ///< Texto da alternativa
};

/**
 * @brief Representa um exercício PBL associado a um tópico.
 *
 * Suporta dois tipos:
 * - Múltipla escolha: options com a correta em correctAnswer
 * - Input numérico: correctAnswer como string de número + tolerance
 *
 * Cada exercício possui um valor em XP para gamificação.
 */
class Exercise {
public:
    Exercise() = default;

    Exercise(int id, int topicId, ExerciseType type,
             std::string question, std::string hint,
             std::string correctAnswer, std::string options,
             double tolerance, int xpReward, int orderIndex,
             std::string createdAt = "")
        : id_(id), topicId_(topicId), type_(type),
          question_(std::move(question)), hint_(std::move(hint)),
          correctAnswer_(std::move(correctAnswer)),
          options_(std::move(options)),
          tolerance_(tolerance), xpReward_(xpReward),
          orderIndex_(orderIndex), createdAt_(std::move(createdAt)) {}

    // Getters
    int          getId()            const { return id_; }
    int          getTopicId()       const { return topicId_; }
    ExerciseType getType()          const { return type_; }
    std::string  getQuestion()      const { return question_; }
    std::string  getHint()          const { return hint_; }
    std::string  getCorrectAnswer() const { return correctAnswer_; }
    std::string  getOptions()       const { return options_; }
    double       getTolerance()     const { return tolerance_; }
    int          getXpReward()      const { return xpReward_; }
    int          getOrderIndex()    const { return orderIndex_; }
    std::string  getCreatedAt()     const { return createdAt_; }

    // Setters
    void setId(int id)                          { id_ = id; }
    void setTopicId(int tid)                    { topicId_ = tid; }
    void setType(ExerciseType t)                { type_ = t; }
    void setQuestion(const std::string& q)      { question_ = q; }
    void setHint(const std::string& h)          { hint_ = h; }
    void setCorrectAnswer(const std::string& a) { correctAnswer_ = a; }
    void setOptions(const std::string& o)       { options_ = o; }
    void setTolerance(double tol)               { tolerance_ = tol; }
    void setXpReward(int xp)                    { xpReward_ = xp; }
    void setOrderIndex(int idx)                 { orderIndex_ = idx; }
    void setCreatedAt(const std::string& t)     { createdAt_ = t; }

    /**
     * @brief Verifica se a resposta fornecida pelo aluno é correta.
     *
     * Para MULTIPLE_CHOICE: comparação case-insensitive da string.
     * Para NUMERIC_INPUT: comparação com tolerância configurável.
     */
    bool checkAnswer(const std::string& userAnswer) const {
        if (type_ == ExerciseType::MULTIPLE_CHOICE) {
            return toLower(userAnswer) == toLower(correctAnswer_);
        } else {
            try {
                double userVal    = std::stod(userAnswer);
                double correctVal = std::stod(correctAnswer_);
                return std::abs(userVal - correctVal) <= tolerance_;
            } catch (...) {
                return false;
            }
        }
    }

private:
    static std::string toLower(std::string s) {
        for (auto& c : s) c = static_cast<char>(std::tolower(c));
        return s;
    }

    int          id_            = 0;
    int          topicId_       = 0;
    ExerciseType type_          = ExerciseType::MULTIPLE_CHOICE;
    std::string  question_;
    std::string  hint_;
    std::string  correctAnswer_;
    std::string  options_;       ///< JSON string com as opções
    double       tolerance_     = 0.001; ///< Para numeric_input
    int          xpReward_      = 10;
    int          orderIndex_    = 0;
    std::string  createdAt_;
};

} // namespace models
} // namespace pbl
