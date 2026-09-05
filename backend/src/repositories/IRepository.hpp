#pragma once
#include <vector>
#include <optional>

namespace pbl {
namespace repositories {

/**
 * @brief Interface genérica de repositório (padrão Repository Pattern).
 *
 * Define as operações CRUD básicas que todo repositório deve implementar.
 * Parâmetros de template:
 *   T  = tipo da entidade (ex: User, Module, Topic)
 *   ID = tipo do identificador (geralmente int)
 */
template<typename T, typename ID = int>
class IRepository {
public:
    virtual ~IRepository() = default;

    /// Busca uma entidade pelo ID. Retorna nullopt se não encontrada.
    virtual std::optional<T> findById(ID id) = 0;

    /// Retorna todas as entidades.
    virtual std::vector<T> findAll() = 0;

    /// Persiste uma nova entidade. Retorna o ID gerado.
    virtual ID create(const T& entity) = 0;

    /// Atualiza uma entidade existente. Retorna true se bem-sucedido.
    virtual bool update(const T& entity) = 0;

    /// Remove uma entidade pelo ID. Retorna true se bem-sucedido.
    virtual bool remove(ID id) = 0;
};

} // namespace repositories
} // namespace pbl
