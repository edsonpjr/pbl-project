#pragma once
#include <string>
#include <sstream>
#include <iomanip>
#include <random>
#include <openssl/sha.h>
#include <openssl/evp.h>

namespace pbl {
namespace utils {

/**
 * @brief Utilitário para hash seguro de senhas.
 *
 * Usa SHA-256 com salt aleatório de 16 bytes.
 * Formato armazenado: "salt$hash" (ambos em hexadecimal).
 *
 * Nota: Em produção, considere usar bcrypt ou Argon2.
 */
class PasswordUtil {
public:
    /**
     * @brief Gera um hash seguro de uma senha.
     * @param password Senha em texto puro
     * @return String no formato "salt$hash"
     */
    static std::string hash(const std::string& password) {
        std::string salt = generateSalt();
        std::string hashed = sha256(salt + password);
        return salt + "$" + hashed;
    }

    /**
     * @brief Verifica se uma senha corresponde ao hash armazenado.
     * @param password   Senha em texto puro
     * @param storedHash Hash no formato "salt$hash"
     * @return true se a senha é válida
     */
    static bool verify(const std::string& password,
                       const std::string& storedHash) {
        auto pos = storedHash.find('$');
        if (pos == std::string::npos) return false;

        std::string salt    = storedHash.substr(0, pos);
        std::string stored  = storedHash.substr(pos + 1);
        std::string computed = sha256(salt + password);

        return computed == stored;
    }

private:
    /// Gera um salt aleatório de 16 bytes em hexadecimal
    static std::string generateSalt() {
        std::random_device rd;
        std::mt19937_64 gen(rd());
        std::uniform_int_distribution<uint64_t> dist;

        std::ostringstream oss;
        oss << std::hex << std::setfill('0')
            << std::setw(16) << dist(gen)
            << std::setw(16) << dist(gen);
        return oss.str();
    }

    /// Calcula SHA-256 e retorna como string hexadecimal
    static std::string sha256(const std::string& input) {
        unsigned char digest[SHA256_DIGEST_LENGTH];
        SHA256(reinterpret_cast<const unsigned char*>(input.c_str()),
               input.size(), digest);

        std::ostringstream oss;
        for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
            oss << std::hex << std::setfill('0') << std::setw(2)
                << static_cast<int>(digest[i]);
        }
        return oss.str();
    }
};

} // namespace utils
} // namespace pbl
