#pragma once
#include <string>
#include <vector>

namespace pbl {
namespace models {

/**
 * @brief Representa um módulo de disciplina (ex: Cálculo 1).
 *
 * Um módulo agrupa tópicos relacionados dentro de uma disciplina.
 * Projetado para ser expansível: novos módulos podem ser adicionados
 * sem alterar a estrutura existente.
 */
class Module {
public:
    Module() = default;

    Module(int id, std::string title, std::string description,
           int orderIndex, bool isPublished = false,
           std::string createdAt = "")
        : id_(id), title_(std::move(title)),
          description_(std::move(description)),
          orderIndex_(orderIndex), isPublished_(isPublished),
          createdAt_(std::move(createdAt)) {}

    // Getters
    int         getId()          const { return id_; }
    std::string getTitle()       const { return title_; }
    std::string getDescription() const { return description_; }
    int         getOrderIndex()  const { return orderIndex_; }
    bool        isPublished()    const { return isPublished_; }
    std::string getCreatedAt()   const { return createdAt_; }

    // Setters
    void setId(int id)                         { id_ = id; }
    void setTitle(const std::string& t)        { title_ = t; }
    void setDescription(const std::string& d)  { description_ = d; }
    void setOrderIndex(int idx)                { orderIndex_ = idx; }
    void setPublished(bool pub)                { isPublished_ = pub; }
    void setCreatedAt(const std::string& t)    { createdAt_ = t; }

private:
    int         id_          = 0;
    std::string title_;
    std::string description_;
    int         orderIndex_  = 0;
    bool        isPublished_ = false;
    std::string createdAt_;
};

} // namespace models
} // namespace pbl
