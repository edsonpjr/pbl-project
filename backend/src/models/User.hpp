#pragma once
#include <string>
#include <ctime>

namespace pbl {
namespace models {

/**
 * @brief Enum representando os papéis disponíveis no sistema.
 */
enum class Role {
    STUDENT,
    PROFESSOR
};

/**
 * @brief Converte uma string para o enum Role.
 */
inline Role roleFromString(const std::string& s) {
    return (s == "professor") ? Role::PROFESSOR : Role::STUDENT;
}

inline std::string roleToString(Role r) {
    return (r == Role::PROFESSOR) ? "professor" : "student";
}

/**
 * @brief Representa um usuário da plataforma.
 *
 * Entidade central do sistema, com suporte a dois papéis:
 * aluno (STUDENT) e professor (PROFESSOR).
 */
class User {
public:
    // Constructors
    User() = default;

    User(int id, std::string name, std::string email,
         std::string passwordHash, Role role, int xp = 0,
         std::string createdAt = "")
        : id_(id), name_(std::move(name)), email_(std::move(email)),
          passwordHash_(std::move(passwordHash)), role_(role),
          xp_(xp), createdAt_(std::move(createdAt)) {}

    // Getters
    int         getId()           const { return id_; }
    std::string getName()         const { return name_; }
    std::string getEmail()        const { return email_; }
    std::string getPasswordHash() const { return passwordHash_; }
    Role        getRole()         const { return role_; }
    int         getXp()           const { return xp_; }
    std::string getCreatedAt()    const { return createdAt_; }

    // Setters
    void setId(int id)                       { id_ = id; }
    void setName(const std::string& n)       { name_ = n; }
    void setEmail(const std::string& e)      { email_ = e; }
    void setPasswordHash(const std::string& h) { passwordHash_ = h; }
    void setRole(Role r)                     { role_ = r; }
    void setXp(int xp)                       { xp_ = xp; }
    void addXp(int amount)                   { xp_ += amount; }
    void setCreatedAt(const std::string& t)  { createdAt_ = t; }

    bool isProfessor() const { return role_ == Role::PROFESSOR; }
    bool isStudent()   const { return role_ == Role::STUDENT; }

private:
    int         id_           = 0;
    std::string name_;
    std::string email_;
    std::string passwordHash_;
    Role        role_         = Role::STUDENT;
    int         xp_           = 0;
    std::string createdAt_;
};

} // namespace models
} // namespace pbl
