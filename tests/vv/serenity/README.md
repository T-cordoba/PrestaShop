# Serenity/JS — BDD con Gherkin en español y patrón Screenplay

Suite E2E de los 10 RF con **Serenity/JS 3.48**, **Cucumber 13.3** y **Playwright 1.63**, con la misma estructura y
versiones que el proyecto de referencia del curso (`serenityjs-e2e-testing`). Cada RF tiene un `.feature` en español con
tres escenarios: exitoso, alternativo y error. Cada escenario lleva las etiquetas `@rf-XX @esc-XX-YY` y la de su integrante (`@juliana` o `@tomas`).

## Screenplay

| Pieza | Dónde | Contenido |
|---|---|---|
| **Actores** | `features/support/serenity.config.ts` | **Juliana** y **Tomás** (`Cast.where`), cada uno con su cliente OAuth de la Admin API |
| **Habilidades** | ídem | `BrowseTheWebWithPlaywright` (back office) y `CallAnApi` (Admin API con el token y los *scopes* del actor) |
| **Tareas** (negocio) | `test/tasks/BackOfficeTasks.ts`, `test/tasks/ApiTasks.ts` | `SignInToTheBackOffice`, `CreateTax`, `CreateZone`, `CreateCountry`, `CreateBrand`, `AddFeatureValue`, `UseTheAdminApi` |
| **Interacciones propias** | `test/interactions/BackOfficeInteractions.ts` | `NavigateInTheBackOffice` (rutas con token CSRF), `FilterTheList` (limpia los filtros guardados y filtra el *grid*), `WaitForNotification`, `SetTheSwitch` (interruptores `ps-switch`) |
| **Preguntas** | `test/questions/BackOfficeQuestions.ts` | `rowsOf`, `rowCountOf`, `formWasRejected`, `lastResponseStatus` |
| **UI (Targets)** | `test/ui/BackOffice.ts` | `LoginForm`, `Form`, `Notifications`, `Grid`, localizados por id/nombre, nunca por texto visible |
| **Pasos** | `features/step-definitions/*.steps.ts` | Tipos de parámetro `{actor}` (Juliana, Tomás) y `{pronoun}` (él, ella) |

## Ejecución

```bash
cd tests/vv/serenity
npm install
npx playwright install chromium
npm test                 # los 30 escenarios
npm run test:juliana     # @juliana (RF-01..05)
npm run test:tomas       # @tomas (RF-06..10)
npm run test:report      # abre el reporte HTML
```

Requisitos: la tienda en `http://localhost:8001`, la Admin API en `https://localhost:8002` y `tests/vv/.env` con las
credenciales del back office y de los dos clientes de la API (archivo local, no versionado).

## Resultados (17/11/2026, una corrida completa de 5 min 12 s)

| Integrante | Escenarios | Aprobados | Fallidos |
|---|---:|---:|---:|
| Juliana Álvarez Arboleda (RF-01..05) | 15 | 15 | 0 |
| Tomás Córdoba Urquijo (RF-06..10) | 15 | 14 | 1 |

- **ESC-10-03 falla por DEF-03**: `POST /admin-api/features/values` con una característica inexistente responde 500 en lugar de 404.
- ESC-01-03 (tasa negativa) y ESC-07-03 (comodín `%`) pasan porque la corrida se hizo con DEF-01 y DEF-04 ya corregidos.
- Reporte: `reports/serenity-js/index.html` (se genera en cada corrida; no se versiona).

## Lecciones

- Las rutas de `GetRequest.to('/x')` se resuelven contra la raíz del servidor: con una URL base que tiene ruta
  (`…/admin-api/`), las peticiones deben ser relativas. En una primera versión los escenarios que esperaban 404 pasaban
  por la razón equivocada (llamaban a una URL inexistente); se corrigió antes de la corrida reportada.
- La Admin API rechaza un `PUT` sin cuerpo con 415: se envía `{}`.
