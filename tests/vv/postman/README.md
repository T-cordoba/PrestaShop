# Pruebas de la Admin API con Postman Agent — PrestaShop (RF de Juliana)

Pruebas de la Admin API para las cinco funcionalidades de Juliana: **RF-01** (crear impuesto), **RF-02** (editar
impuesto), **RF-03** (crear zona), **RF-04** (eliminar zona) y **RF-05** (crear país).

La colección la creó, ejecutó y corrigió **Postman Agent** (Agent Mode de Postman) a partir de prompts en lenguaje
natural: el equipo describió la autenticación, los endpoints y los casos exitosos y no exitosos, y el Agent generó
las peticiones, los scripts de prueba y el encadenamiento de variables. Las conclusiones del Agent sobre qué falla es
de la prueba y qué falla es de la API se verificaron a mano contra la API local antes de aceptarlas.

| | |
|---|---|
| Herramienta | Postman (web) — Agent Mode y Collection Runner |
| Workspace | Workspace de Postman del equipo (cuenta de Tomás), colección `PrestaShop Admin API — RF-01..RF-05` |
| Sistema bajo prueba | https://app-production-91604777.up.railway.app/admin-api (despliegue en Railway) |
| Autenticación | OAuth2 *client credentials* con el cliente `vv-juliana`; `clientSecret` solo en el entorno de Postman |
| Datos | Nombres con prefijo `VV-PM` y sufijo aleatorio; la colección borra lo que crea |
| Fecha de ejecución | 17/11/2026 |
| Responsable de los RF | Juliana Álvarez Arboleda |

## Estructura de la colección

20 peticiones en orden: autenticación, 7 casos exitosos encadenados (impuesto → edición → zona → país → borrado de
zona), 9 casos no exitosos (con su preparación) y 2 de limpieza. Cada petición de prueba valida el código HTTP, el
cuerpo de la respuesta y que responda en menos de 3 s; los casos no exitosos además exigen «nunca 5xx».

## Resultados

Corrida completa del Runner del 17/11/2026, 02:13:06: **57 aserciones, 50 aprobadas, 7 fallidas**, 0 errores,
respuesta media 319 ms. Evidencia: `evidencia/runner-resumen-por-peticion.jpg` y `evidencia/runner-fallas.jpg`.

| ID | RF | Tipo | Petición | Esperado | Obtenido | Estado | Defecto / causa |
|---|---|---|---|---|---|---|---|
| RF-01 | RF-01 | Exitoso | `POST /taxes` | 201 con `taxId` | 201 | Aprobado | |
| NEG-01 | RF-01 | No exitoso | `POST /taxes` con tasa `-5` | 4xx | **500** | **Fallido** | **DEF-07** (nuevo) |
| NEG-02 | RF-01 | No exitoso | `POST /taxes` sin nombre | 4xx con el error | 422 con la lista de violaciones | Fallido | Error de la prueba |
| RF-02a | RF-02 | Exitoso | `PATCH /taxes/{id}` tasa 16 | 200 | 200 | Aprobado | |
| RF-02b | RF-02 | Exitoso | `GET /taxes/{id}` | 200, tasa 16 | 200 | Aprobado | |
| NEG-03 | RF-02 | No exitoso | `PATCH /taxes/999999` | 404 | 404 | Aprobado | |
| RF-03 | RF-03 | Exitoso | `POST /zones` | 201 con `zoneId` | 201 | Aprobado | |
| NEG-04 | RF-03 | No exitoso | `POST /zones` con nombre vacío | 4xx con el error | 422 con la lista de violaciones | Fallido | Error de la prueba |
| RF-05 | RF-05 | Exitoso | `POST /countries` | 201 con `countryId` | 201 | Aprobado | |
| NEG-05 | RF-05 | No exitoso | `POST /countries` con un campo inexistente en `addressFormat` | 4xx por el formato | 400 *Not encodable value* | **Bloqueado** | Falso positivo: `{{zoneId}}` sin resolver dejó el JSON inválido |
| RF-04 | RF-04 | Exitoso | `DELETE /zones/{id}` (zona sin países) | 204 | 204 | Aprobado | |
| NEG-07 | RF-04 | No exitoso | `DELETE /zones/999999` | 404 | 404 | Aprobado | |
| NEG-08 | RF-04 | No exitoso | `DELETE /zones/{id}` con un país asignado | 4xx | **204** (borrada) | **Fallido** | **DEF-02** |

**13 casos: 8 aprobados, 4 fallidos y 1 bloqueado.** Las peticiones de preparación (NEG-06, NEG-06b) y limpieza
(NEG-09, CLEANUP) no cuentan como casos; NEG-10 (limpieza de la zona en conflicto) falló en cascada con 404 porque
NEG-08 ya la había borrado, lo que confirma DEF-02.

Defectos del producto encontrados:

- **DEF-07 (nuevo).** `POST /admin-api/taxes` con tasa negativa responde **500 Internal Server Error**. La corrección
  de DEF-01 rechaza la tasa en el *handler* (`TaxConstraintException`), pero la Admin API no traduce esa excepción a
  422, así que el cliente recibe un error de servidor sin explicación. Verificado también contra la API local.
- **DEF-02 (ya conocido), ahora en la API.** `DELETE /admin-api/zones/{id}` borra una zona que tiene países asignados
  sin rechazarlo ni advertirlo.

## Correcciones durante la ejecución

| Prueba | Síntoma | Diagnóstico | Corrección | Quién |
|---|---|---|---|---|
| RF-02a, RF-02b | La comparación de la tasa fallaba con 200 | La prueba comparaba con el texto `"16"`; la API devuelve el número `16.0` | `parseFloat(json.rate)` con `closeTo(16, 0.01)` | Agent |
| RF-05 | 400 *Not normalizable value* | El Agent lo atribuyó a la API (`defaultCurrencyId: 0` o `isoCode`). Verificado a mano: con los mismos datos la API local responde 201; el 400 aparece cuando un número o booleano viaja como texto | Enviar `callPrefix`, `zoneId`, `defaultCurrencyId` y los booleanos sin comillas; `isoCode` de 3 letras | Agent, con el diagnóstico corregido por el equipo |
| Limpieza del país | 404 en `/countries/null` | Cascada de RF-05: sin país creado no había `countryId` | Borrar el país solo si existe `countryId` | Agent |
| NEG-02, NEG-04 | «Cuerpo contiene error» falla con 422 correcto | La API devuelve un arreglo de violaciones (`propertyPath`, `message`); la prueba buscaba un campo `error` | **Pendiente** (sin cuota del Agent): validar `Array.isArray(json) && json[0].propertyPath` | — |
| NEG-05 | Pasa con 400 | El cuerpo llevaba `"zoneId": {{zoneId}}` sin resolver (la zona ya se había borrado en RF-04): JSON inválido, no validación del formato | **Pendiente**: usar la zona de NEG-06 o crear una propia | — |

## Limitaciones

- **Cuota del Agent.** El plan gratuito de Postman limita el uso del Agent; las dos correcciones pendientes se dejaron
  documentadas en vez de hacerlas a mano, para no mezclar el trabajo del Agent con el del equipo.
- **Corridas.** El historial del Runner tiene 6 corridas: 27 aserciones (21 ✓), 25 (21 ✓), dos de 25/25 sobre los
  casos exitosos ya corregidos y la completa de 57 (50 ✓) con los casos no exitosos.
- **Entorno público.** Las pruebas corren contra el despliegue en Railway; crean y borran sus propios datos.
