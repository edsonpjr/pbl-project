#pragma once
#include <string>
#include <sstream>
#include <stdexcept>
#include <ctime>
#include <openssl/hmac.h>
#include <openssl/sha.h>
#include "../../third_party/json.hpp"

namespace pbl {
namespace utils {

/**
 * @brief Utilitário para codificação/decodificação Base64URL (RFC 4648).
 *
 * Base64URL é a variante usada em JWTs: sem padding, usa '-' e '_'
 * em vez de '+' e '/'.
 */
class Base64Url {
public:
    static std::string encode(const std::string& input) {
        return encode(reinterpret_cast<const unsigned char*>(input.data()), input.size());
    }

    static std::string encode(const unsigned char* data, size_t len) {
        static const char* table =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        std::string result;
        result.reserve(((len + 2) / 3) * 4);

        for (size_t i = 0; i < len; i += 3) {
            unsigned int b = (data[i] & 0xFF) << 16;
            if (i + 1 < len) b |= (data[i + 1] & 0xFF) << 8;
            if (i + 2 < len) b |= (data[i + 2] & 0xFF);

            result += table[(b >> 18) & 0x3F];
            result += table[(b >> 12) & 0x3F];
            result += (i + 1 < len) ? table[(b >> 6) & 0x3F] : '=';
            result += (i + 2 < len) ? table[b & 0x3F]        : '=';
        }

        // Converter para Base64URL: remover padding, substituir chars
        while (!result.empty() && result.back() == '=') result.pop_back();
        for (auto& c : result) {
            if (c == '+') c = '-';
            else if (c == '/') c = '_';
        }
        return result;
    }

    static std::string decode(std::string input) {
        // Converter de volta para Base64 padrão
        for (auto& c : input) {
            if (c == '-') c = '+';
            else if (c == '_') c = '/';
        }
        // Adicionar padding
        while (input.size() % 4 != 0) input += '=';

        static const int table[256] = {
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,
            52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,
            15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,
            -1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
            41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
        };

        std::string result;
        result.reserve(input.size() * 3 / 4);

        for (size_t i = 0; i < input.size(); i += 4) {
            int b0 = table[(unsigned char)input[i]];
            int b1 = table[(unsigned char)input[i+1]];
            int b2 = (input[i+2] != '=') ? table[(unsigned char)input[i+2]] : 0;
            int b3 = (input[i+3] != '=') ? table[(unsigned char)input[i+3]] : 0;

            result += static_cast<char>((b0 << 2) | (b1 >> 4));
            if (input[i+2] != '=') result += static_cast<char>((b1 << 4) | (b2 >> 2));
            if (input[i+3] != '=') result += static_cast<char>((b2 << 6) | b3);
        }
        return result;
    }
};

/**
 * @brief Implementação de JWT (JSON Web Token) com HMAC-SHA256.
 *
 * Suporta geração e validação de tokens com payload customizável.
 * Algoritmo: HS256 (HMAC-SHA256) conforme RFC 7519.
 */
class JwtUtil {
public:
    /**
     * @brief Gera um token JWT.
     * @param userId  ID do usuário
     * @param email   E-mail do usuário
     * @param role    Papel do usuário ("student" ou "professor")
     * @param secret  Chave secreta HMAC
     * @param ttlSecs Tempo de vida do token em segundos (padrão: 24h)
     * @return Token JWT como string
     */
    static std::string generate(int userId, const std::string& email,
                                const std::string& role,
                                const std::string& secret,
                                long ttlSecs = 86400) {
        // Header
        nlohmann::json header = {{"alg", "HS256"}, {"typ", "JWT"}};
        std::string headerB64 = Base64Url::encode(header.dump());

        // Payload
        long now = static_cast<long>(std::time(nullptr));
        nlohmann::json payload = {
            {"sub",   userId},
            {"email", email},
            {"role",  role},
            {"iat",   now},
            {"exp",   now + ttlSecs}
        };
        std::string payloadB64 = Base64Url::encode(payload.dump());

        // Signing input
        std::string signingInput = headerB64 + "." + payloadB64;

        // Assinatura HMAC-SHA256
        std::string sig = hmacSha256(signingInput, secret);

        return signingInput + "." + sig;
    }

    /**
     * @brief Valida e decodifica um JWT.
     * @param token  Token JWT a validar
     * @param secret Chave secreta HMAC
     * @return Payload decodificado como JSON
     * @throws std::runtime_error se inválido ou expirado
     */
    static nlohmann::json verify(const std::string& token,
                                  const std::string& secret) {
        auto parts = split(token, '.');
        if (parts.size() != 3) {
            throw std::runtime_error("Token JWT inválido: formato incorreto");
        }

        std::string signingInput = parts[0] + "." + parts[1];
        std::string expectedSig  = hmacSha256(signingInput, secret);

        if (parts[2] != expectedSig) {
            throw std::runtime_error("Token JWT inválido: assinatura incorreta");
        }

        std::string payloadJson = Base64Url::decode(parts[1]);
        nlohmann::json payload  = nlohmann::json::parse(payloadJson);

        long now = static_cast<long>(std::time(nullptr));
        if (payload.contains("exp") && payload["exp"].get<long>() < now) {
            throw std::runtime_error("Token JWT expirado");
        }

        return payload;
    }

private:
    /// Calcula HMAC-SHA256 e retorna em Base64URL
    static std::string hmacSha256(const std::string& data,
                                   const std::string& key) {
        unsigned char digest[EVP_MAX_MD_SIZE];
        unsigned int  digestLen = 0;

        HMAC(EVP_sha256(),
             key.c_str(),   static_cast<int>(key.size()),
             reinterpret_cast<const unsigned char*>(data.c_str()),
             data.size(),
             digest, &digestLen);

        return Base64Url::encode(digest, digestLen);
    }

    static std::vector<std::string> split(const std::string& s, char delim) {
        std::vector<std::string> parts;
        std::stringstream ss(s);
        std::string item;
        while (std::getline(ss, item, delim)) parts.push_back(item);
        return parts;
    }
};

} // namespace utils
} // namespace pbl
