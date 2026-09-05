#pragma once
#include <string>

namespace pbl {
namespace models {

/**
 * @brief Representa um tópico dentro de um módulo.
 *
 * Cada tópico contém teoria (content) e está associado a um módulo.
 * Exemplo: dentro do módulo "Cálculo 1", tópico "Limites".
 */
class Topic {
public:
    Topic() = default;

    Topic(int id, int moduleId, std::string title,
          std::string content, std::string theory,
          int orderIndex, bool isPublished = false,
          std::string createdAt = "")
        : id_(id), moduleId_(moduleId), title_(std::move(title)),
          content_(std::move(content)), theory_(std::move(theory)),
          orderIndex_(orderIndex), isPublished_(isPublished),
          createdAt_(std::move(createdAt)) {}

    // Getters
    int         getId()          const { return id_; }
    int         getModuleId()    const { return moduleId_; }
    std::string getTitle()       const { return title_; }
    std::string getContent()     const { return content_; }
    std::string getTheory()      const { return theory_; }
    int         getOrderIndex()  const { return orderIndex_; }
    bool        isPublished()    const { return isPublished_; }
    std::string getCreatedAt()   const { return createdAt_; }

    // Setters
    void setId(int id)                        { id_ = id; }
    void setModuleId(int mid)                 { moduleId_ = mid; }
    void setTitle(const std::string& t)       { title_ = t; }
    void setContent(const std::string& c)     { content_ = c; }
    void setTheory(const std::string& th)     { theory_ = th; }
    void setOrderIndex(int idx)               { orderIndex_ = idx; }
    void setPublished(bool pub)               { isPublished_ = pub; }
    void setCreatedAt(const std::string& t)   { createdAt_ = t; }

private:
    int         id_          = 0;
    int         moduleId_    = 0;
    std::string title_;
    std::string content_;
    std::string theory_;
    int         orderIndex_  = 0;
    bool        isPublished_ = false;
    std::string createdAt_;
};

} // namespace models
} // namespace pbl
