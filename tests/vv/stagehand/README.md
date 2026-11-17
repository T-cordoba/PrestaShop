# Stagehand + Ollama — pruebas E2E con IA

Suite E2E de los 10 RF (3 escenarios por RF: exitoso, alternativo y error) escrita con **Stagehand 4.3.0** y un modelo
**local** servido por **Ollama** (`qwen2.5`, 7B). Sigue el enfoque del proyecto de referencia del curso
(`mauricioramirezv/Stagehand-E2E-AI`) y de Beverage Ledger: navegador local, un `ClientLLM` propio hacia la API
compatible con OpenAI de Ollama (`support/ollama-client.mts`) y **aserciones deterministas** sobre el DOM después de
cada acción de la IA.

## Configuración

| Elemento | Valor |
|---|---|
| Stagehand | 4.3.0 (`package.json`), zod 4.4.3, tsx 4.20.6 |
| Modelo | Ollama `qwen2.5:latest` (`OLLAMA_MODEL`), local, sin claves de nube |
| Navegador | Chrome *headless* lanzado por `localBrowser` (`HEADLESS=false` para verlo) |
| Seguridad | Se niega a correr fuera de `localhost`; el login se hace sin IA y la contraseña nunca llega al modelo; las evidencias enmascaran secretos y JWT |
| Datos | Datos demo del instalador + datos `VV-STH … <sufijo>` únicos por corrida |
| Ejecución | `cd tests/vv/stagehand && npm test` (las dos suites en serie) |
| Evidencia | `reports/<fecha>/`: una captura por escenario, `results-<integrante>.json`, `ai-calls.jsonl` (cada `act`/`extract`), `ollama.jsonl`, `stagehand-*.log.jsonl`; `reports/junit-stagehand.xml` |

Patrón de cada escenario: la IA ejecuta en lenguaje natural la acción clave (`act`, p. ej. «Type … into the Name
field», «Click the Save button») o lee la página (`extract` con esquema zod), y una aserción determinista comprueba el
resultado en el DOM (mensaje de éxito, error de validación, filas del *grid*).

## Resultados (16/11/2026)

| Integrante | Escenarios | Aprobados | Fallidos | Duración |
|---|---:|---:|---:|---:|
| Juliana Álvarez Arboleda (RF-01..05) | 15 | 13 | 2 | 12,4 min |
| Tomás Córdoba Urquijo (RF-06..10) | 15 | 9 | 6 | 8,0 min |
| **Total** | **30** | **22** | **8** | 20,4 min |

**Ninguno de los 8 fallos es un defecto de PrestaShop:** en todos, la IA actuó sobre otro elemento o leyó mal la página,
y la aserción determinista lo detectó.

| Escenario | Qué hizo la IA | Comprobación |
|---|---|---|
| STH-01-02, STH-05-01 | No completó el formulario: no apareció el mensaje de éxito | Captura del formulario sin enviar |
| STH-06-01, STH-06-02 | `act()` informó éxito al «escribir» el nombre, pero el campo quedó vacío | El navegador bloqueó el envío («Completa este campo») |
| STH-07-01 | Se le pidió escribir en el filtro y hizo clic en un botón | El *grid* mostró «No records found» |
| STH-07-02 | `extract()` leyó 0 productos para «Studio Design»; la fila muestra 9 | Comparación con el texto de la fila |
| STH-09-01 | `extract()` omitió «Fashion supplier» | Comparación con los proveedores demo |
| STH-09-02 | Hizo clic en la fila y abrió la ficha del proveedor en lugar del menú ⋮ | Se verificó en la BD que no borró nada |

STH-07-03 (comodín `%` en el filtro de marcas) pasa porque la corrida se hizo con DEF-04 ya corregido.

## Aportes

- Las instrucciones en lenguaje natural sobreviven a cambios de selectores: ningún escenario depende de ids.
- `extract()` permite leer tablas sin escribir *scrapers*; cuando acierta, la aserción contra el DOM lo confirma.
- La combinación IA + aserción determinista nunca dio un falso aprobado: los errores de la IA se convirtieron en fallos visibles.

## Limitaciones

- Un modelo local de 7B confunde elementos parecidos (campo de nombre vs. editor de texto enriquecido, botón vs. filtro) y a veces informa éxito sin haber actuado.
- Lentitud: de 30 s a 2 min por escenario; ejecutar con Docker, Jenkins, SonarQube y el modelo a la vez agotó los 16 GB de RAM del equipo (dos corridas interrumpidas antes de esta).
- Resultados no deterministas: el mismo escenario (STH-01-01) falló en una corrida y pasó en otra.
- Las acciones destructivas (borrar) son riesgosas con la IA: por eso los escenarios de borrado solo abren y cancelan el diálogo.
