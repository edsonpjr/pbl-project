#include <iostream>
#include <string>
#include <memory>
#include <csignal>

#define CPPHTTPLIB_OPENSSL_SUPPORT 0  // Sem TLS no backend (proxy reverso no Docker)
#include "../third_party/httplib.h"
#include "../third_party/json.hpp"

#include "db/Database.hpp"
#include "repositories/UserRepository.hpp"
#include "repositories/Repositories.hpp"
#include "middleware/AuthMiddleware.hpp"
#include "controllers/AuthController.hpp"
#include "controllers/Controllers.hpp"
#include "controllers/ExerciseController.hpp"
#include "utils/PasswordUtil.hpp"

using namespace pbl;

// ─── Configuração ────────────────────────────────────────────────────────────

static const std::string DB_PATH    = "/data/pbl.db";
static const std::string JWT_SECRET = []() -> std::string {
    const char* env = std::getenv("JWT_SECRET");
    return env ? env : "pbl-secret-key-change-in-production";
}();
static const int PORT = []() -> int {
    const char* env = std::getenv("PORT");
    return env ? std::stoi(env) : 8080;
}();

// ─── Seed de dados iniciais ───────────────────────────────────────────────────

/**
 * @brief Popula o banco com dados iniciais de Cálculo 1 caso esteja vazio.
 *
 * Cria:
 * - 1 professor e 1 aluno de exemplo
 * - Módulo: Cálculo 1
 * - Tópico: Limites — com teoria e exercícios (múltipla escolha + numérico)
 */
void seedDatabase(db::Database& db,
                  repositories::UserRepository&     userRepo,
                  repositories::ModuleRepository&   moduleRepo,
                  repositories::TopicRepository&    topicRepo,
                  repositories::ExerciseRepository& exerciseRepo) {
    // Só faz seed se não houver usuários
    if (!userRepo.findAll().empty()) return;

    std::cout << "[Seed] Populando dados iniciais..." << std::endl;

    // ── Usuários ──────────────────────────────────────────────────────────
    models::User prof;
    prof.setName("Prof. Maria Silva");
    prof.setEmail("professor@pbl.com");
    prof.setPasswordHash(utils::PasswordUtil::hash("professor123"));
    prof.setRole(models::Role::PROFESSOR);
    userRepo.create(prof);

    models::User student;
    student.setName("João Aluno");
    student.setEmail("aluno@pbl.com");
    student.setPasswordHash(utils::PasswordUtil::hash("aluno123"));
    student.setRole(models::Role::STUDENT);
    userRepo.create(student);

    // ── Módulo: Cálculo 1 ─────────────────────────────────────────────────
    models::Module calc1;
    calc1.setTitle("Cálculo 1");
    calc1.setDescription(
        "Fundamentos do Cálculo Diferencial e Integral. "
        "Aborda limites, continuidade, derivadas e introdução à integração.");
    calc1.setOrderIndex(1);
    calc1.setPublished(true);
    int moduleId = moduleRepo.create(calc1);

    // ── Tópico 1: Limites ─────────────────────────────────────────────────
    models::Topic limites;
    limites.setModuleId(moduleId);
    limites.setTitle("Limites");
    limites.setContent(
        "O conceito de limite é a base do Cálculo. "
        "Estudamos o comportamento de uma função f(x) quando x se aproxima de um valor c.");
    limites.setTheory(R"(
## O que é um Limite?

O **limite** de uma função f(x) quando x tende a c é o valor L que f(x) se aproxima
conforme x se aproxima de c, sem necessariamente ser igual a c.

**Notação:** lim(x→c) f(x) = L

### Propriedades dos Limites

Sejam lim f(x) = L e lim g(x) = M. Então:

1. **Soma:** lim [f(x) + g(x)] = L + M
2. **Produto:** lim [f(x) · g(x)] = L · M
3. **Quociente:** lim [f(x) / g(x)] = L/M  (M ≠ 0)
4. **Potência:** lim [f(x)]^n = L^n

### Limites Laterais

- **Limite à esquerda:** lim(x→c⁻) f(x)
- **Limite à direita:** lim(x→c⁺) f(x)

O limite existe se e somente se os limites laterais são iguais.

### Limites Notáveis

- lim(x→0) sen(x)/x = 1
- lim(x→∞) (1 + 1/x)^x = e ≈ 2,718
)");
    limites.setOrderIndex(1);
    limites.setPublished(true);
    int topicLimitesId = topicRepo.create(limites);

    // ── Tópico 2: Derivadas ───────────────────────────────────────────────
    models::Topic derivadas;
    derivadas.setModuleId(moduleId);
    derivadas.setTitle("Derivadas");
    derivadas.setContent(
        "A derivada mede a taxa de variação instantânea de uma função. "
        "É a base do Cálculo Diferencial.");
    derivadas.setTheory(R"(
## O que é uma Derivada?

A **derivada** de f(x) em x = a é definida como:

f'(a) = lim(h→0) [f(a+h) - f(a)] / h

### Regras de Derivação

| Função        | Derivada        |
|---------------|-----------------|
| c (constante) | 0               |
| x^n           | n · x^(n-1)     |
| e^x           | e^x             |
| ln(x)         | 1/x             |
| sen(x)        | cos(x)          |
| cos(x)        | -sen(x)         |

### Regras Compostas

- **Regra da Soma:** (f + g)' = f' + g'
- **Regra do Produto:** (f · g)' = f'g + fg'
- **Regra do Quociente:** (f/g)' = (f'g - fg') / g²
- **Regra da Cadeia:** (f∘g)' = f'(g(x)) · g'(x)
)");
    derivadas.setOrderIndex(2);
    derivadas.setPublished(true);
    int topicDerivadasId = topicRepo.create(derivadas);

    // ── Exercícios — Tópico: Limites ──────────────────────────────────────

    // Ex 1: Múltipla escolha — definição de limite
    {
        models::Exercise e;
        e.setTopicId(topicLimitesId);
        e.setType(models::ExerciseType::MULTIPLE_CHOICE);
        e.setQuestion(
            "Qual é o valor de lim(x→2) (x² - 4) / (x - 2)?");
        e.setHint("Fatore o numerador como diferença de quadrados: a² - b² = (a-b)(a+b)");
        e.setCorrectAnswer("b");
        e.setOptions("[{\"label\":\"a\",\"text\":\"0\"},"
                     "{\"label\":\"b\",\"text\":\"4\"},"
                     "{\"label\":\"c\",\"text\":\"2\"},"
                     "{\"label\":\"d\",\"text\":\"Nao existe\"}]");
        e.setXpReward(15);
        e.setOrderIndex(1);
        exerciseRepo.create(e);
    }

    // Ex 2: Múltipla escolha — limite lateral
    {
        models::Exercise e;
        e.setTopicId(topicLimitesId);
        e.setType(models::ExerciseType::MULTIPLE_CHOICE);
        e.setQuestion(
            "Para que o limite lim(x→c) f(x) exista, é necessário que:");
        e.setHint("Pense nos limites laterais — à esquerda e à direita de c.");
        e.setCorrectAnswer("c");
        e.setOptions("[{\"label\":\"a\",\"text\":\"f(c) esteja definida\"},"
                     "{\"label\":\"b\",\"text\":\"f(c) seja igual ao limite\"},"
                     "{\"label\":\"c\",\"text\":\"Os limites laterais sejam iguais\"},"
                     "{\"label\":\"d\",\"text\":\"f seja continua em todo o dominio\"}]");
        e.setXpReward(10);
        e.setOrderIndex(2);
        exerciseRepo.create(e);
    }

    // Ex 3: Input numérico — cálculo direto
    {
        models::Exercise e;
        e.setTopicId(topicLimitesId);
        e.setType(models::ExerciseType::NUMERIC_INPUT);
        e.setQuestion(
            "Calcule: lim(x→3) (2x + 1). Digite apenas o valor numérico.");
        e.setHint("Para funções polinomiais, o limite é obtido por substituição direta.");
        e.setCorrectAnswer("7");
        e.setOptions("[]");
        e.setTolerance(0.01);
        e.setXpReward(20);
        e.setOrderIndex(3);
        exerciseRepo.create(e);
    }

    // Ex 4: Input numérico — limite notável
    {
        models::Exercise e;
        e.setTopicId(topicLimitesId);
        e.setType(models::ExerciseType::NUMERIC_INPUT);
        e.setQuestion(
            "Qual é o valor de lim(x→0) sen(x)/x? (Use 1 casa decimal)");
        e.setHint("Este é um dos limites fundamentais do Cálculo. Analise o gráfico de sen(x)/x próximo a 0.");
        e.setCorrectAnswer("1");
        e.setOptions("[]");
        e.setTolerance(0.01);
        e.setXpReward(25);
        e.setOrderIndex(4);
        exerciseRepo.create(e);
    }

    // ── Exercícios — Tópico: Derivadas ────────────────────────────────────

    // Ex 1: Múltipla escolha — regra da potência
    {
        models::Exercise e;
        e.setTopicId(topicDerivadasId);
        e.setType(models::ExerciseType::MULTIPLE_CHOICE);
        e.setQuestion("Qual é a derivada de f(x) = x³ + 2x?");
        e.setHint("Aplique a regra da potência: d/dx(xⁿ) = n·xⁿ⁻¹");
        e.setCorrectAnswer("a");
        e.setOptions("[{\"label\":\"a\",\"text\":\"3x^2 + 2\"},"
                     "{\"label\":\"b\",\"text\":\"3x^2 + 2x\"},"
                     "{\"label\":\"c\",\"text\":\"x^2 + 2\"},"
                     "{\"label\":\"d\",\"text\":\"3x^3 + 2\"}]");
        e.setXpReward(15);
        e.setOrderIndex(1);
        exerciseRepo.create(e);
    }

    // Ex 2: Input numérico — derivada em ponto
    {
        models::Exercise e;
        e.setTopicId(topicDerivadasId);
        e.setType(models::ExerciseType::NUMERIC_INPUT);
        e.setQuestion("Seja f(x) = x² + 3x. Calcule f'(2).");
        e.setHint("Derive f(x) usando a regra da potência e depois substitua x = 2.");
        e.setCorrectAnswer("7");
        e.setOptions("[]");
        e.setTolerance(0.01);
        e.setXpReward(20);
        e.setOrderIndex(2);
        exerciseRepo.create(e);
    }

    // Ex 3: Múltipla escolha — derivada de e^x
    {
        models::Exercise e;
        e.setTopicId(topicDerivadasId);
        e.setType(models::ExerciseType::MULTIPLE_CHOICE);
        e.setQuestion("Qual é a derivada de f(x) = e^x?");
        e.setHint("A função exponencial natural tem uma propriedade especial com sua derivada.");
        e.setCorrectAnswer("b");
        e.setOptions("[{\"label\":\"a\",\"text\":\"x * e^(x-1)\"},"
                     "{\"label\":\"b\",\"text\":\"e^x\"},"
                     "{\"label\":\"c\",\"text\":\"ln(x)\"},"
                     "{\"label\":\"d\",\"text\":\"1/e^x\"}]");
        e.setXpReward(10);
        e.setOrderIndex(3);
        exerciseRepo.create(e);
    }

    std::cout << "[Seed] Dados iniciais criados com sucesso!" << std::endl;
    std::cout << "[Seed] Professor: professor@pbl.com / professor123" << std::endl;
    std::cout << "[Seed] Aluno:     aluno@pbl.com    / aluno123" << std::endl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

int main() {
    std::cout << "╔═══════════════════════════════════════╗" << std::endl;
    std::cout << "║   PBL Platform — Backend C++          ║" << std::endl;
    std::cout << "╚═══════════════════════════════════════╝" << std::endl;

    // ── Inicializar banco de dados ────────────────────────────────────────
    auto database = std::make_unique<db::Database>(DB_PATH);
    database->initSchema();

    // ── Instanciar repositories ──────────────────────────────────────────
    repositories::UserRepository      userRepo(*database);
    repositories::ModuleRepository    moduleRepo(*database);
    repositories::TopicRepository     topicRepo(*database);
    repositories::ExerciseRepository  exerciseRepo(*database);
    repositories::ProgressRepository  progressRepo(*database);
    repositories::SubmissionRepository submissionRepo(*database);

    // ── Seed de dados iniciais ────────────────────────────────────────────
    seedDatabase(*database, userRepo, moduleRepo, topicRepo, exerciseRepo);

    // ── Middleware e Controllers ──────────────────────────────────────────
    middleware::AuthMiddleware auth(JWT_SECRET);

    controllers::AuthController       authCtrl(userRepo, auth);
    controllers::UserController       userCtrl(userRepo);
    controllers::ModuleController     moduleCtrl(moduleRepo);
    controllers::TopicController      topicCtrl(topicRepo);
    controllers::ExerciseController   exerciseCtrl(exerciseRepo);
    controllers::SubmissionController submCtrl(submissionRepo, exerciseRepo,
                                               progressRepo, userRepo);

    // ── Servidor HTTP ─────────────────────────────────────────────────────
    httplib::Server svr;

    // CORS — permitir chamadas do frontend React
    svr.set_pre_routing_handler([](const httplib::Request& req,
                                    httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin",  "*");
        res.set_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.set_header("Access-Control-Allow-Headers",
                       "Authorization,Content-Type");
        if (req.method == "OPTIONS") {
            res.status = 204;
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // ── Rotas de autenticação ─────────────────────────────────────────────
    svr.Post("/api/auth/register", [&](auto& req, auto& res) {
        authCtrl.registerUser(req, res);
    });
    svr.Post("/api/auth/login", [&](auto& req, auto& res) {
        authCtrl.login(req, res);
    });
    svr.Get("/api/auth/me", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        authCtrl.me(req, res, claims);
    }));

    // ── Rotas de usuários ─────────────────────────────────────────────────
    svr.Get("/api/users", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        userCtrl.getAll(req, res, claims);
    }));
    svr.Get("/api/users/ranking", [&](auto& req, auto& res) {
        userCtrl.getRanking(req, res);
    });
    svr.Get("/api/users/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        userCtrl.getById(req, res, claims);
    }));
    svr.Put("/api/users/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        userCtrl.update(req, res, claims);
    }));
    svr.Delete("/api/users/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        userCtrl.remove(req, res, claims);
    }));

    // ── Rotas de módulos ─────────────────────────────────────────────────
    svr.Get("/api/modules", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        if (claims.role == "professor") moduleCtrl.getAll(req, res, claims);
        else moduleCtrl.getPublished(req, res);
    }));
    svr.Get("/api/modules/:id", [&](auto& req, auto& res) {
        moduleCtrl.getById(req, res);
    });
    svr.Post("/api/modules", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        moduleCtrl.create(req, res, claims);
    }));
    svr.Put("/api/modules/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        moduleCtrl.update(req, res, claims);
    }));
    svr.Delete("/api/modules/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        moduleCtrl.remove(req, res, claims);
    }));

    // ── Rotas de tópicos ──────────────────────────────────────────────────
    svr.Get("/api/modules/:moduleId/topics",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        topicCtrl.getByModule(req, res, claims);
    }));
    svr.Get("/api/topics/:id", auth.requireAuth([&](auto& req, auto& res, auto& /*claims*/) {
        topicCtrl.getById(req, res);
    }));
    svr.Post("/api/modules/:moduleId/topics",
             auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        topicCtrl.create(req, res, claims);
    }));
    svr.Put("/api/topics/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        topicCtrl.update(req, res, claims);
    }));
    svr.Delete("/api/topics/:id", auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        topicCtrl.remove(req, res, claims);
    }));

    // ── Rotas de exercícios ───────────────────────────────────────────────
    svr.Get("/api/topics/:topicId/exercises",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        exerciseCtrl.getByTopic(req, res, claims);
    }));
    svr.Get("/api/exercises/:id",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        exerciseCtrl.getById(req, res, claims);
    }));
    svr.Post("/api/topics/:topicId/exercises",
             auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        exerciseCtrl.create(req, res, claims);
    }));
    svr.Put("/api/exercises/:id",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        exerciseCtrl.update(req, res, claims);
    }));
    svr.Delete("/api/exercises/:id",
               auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        exerciseCtrl.remove(req, res, claims);
    }));

    // ── Rotas de submissão e progresso ────────────────────────────────────
    svr.Post("/api/exercises/:exerciseId/submit",
             auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        submCtrl.submit(req, res, claims);
    }));
    svr.Get("/api/submissions/me",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        submCtrl.getMySubmissions(req, res, claims);
    }));
    svr.Get("/api/progress/me",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        submCtrl.getMyProgress(req, res, claims);
    }));
    svr.Get("/api/progress/me/:topicId",
            auth.requireAuth([&](auto& req, auto& res, auto& claims) {
        submCtrl.getProgressByTopic(req, res, claims);
    }));

    // ── Health check ──────────────────────────────────────────────────────
    svr.Get("/api/health", [](auto&, auto& res) {
        nlohmann::json body = {{"status", "ok"}, {"service", "pbl-backend"}};
        res.set_content(body.dump(), "application/json");
    });

    std::cout << "[Server] Iniciando na porta " << PORT << "..." << std::endl;
    std::cout << "[Server] Health: http://localhost:" << PORT << "/api/health" << std::endl;

    if (!svr.listen("0.0.0.0", PORT)) {
        std::cerr << "[Server] Falha ao iniciar na porta " << PORT << std::endl;
        return 1;
    }

    return 0;
}
