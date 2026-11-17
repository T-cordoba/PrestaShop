# Pruebas E2E con BugBug — PrestaShop (RF de Tomás)

Pruebas automatizadas de las cinco funcionalidades de Tomás: **RF-06** (crear marca), **RF-07** (listar y filtrar
marcas), **RF-08** (activar/desactivar proveedor), **RF-09** (eliminar proveedor) y **RF-10** (agregar valor a una
característica).

Las pruebas se crearon, ejecutaron y corrigieron con un agente de IA (Claude Code) conectado a BugBug por su
**servidor MCP**. El agente no grabó clics: sacó los selectores del DOM del back office (y de las suites de Cypress
que ya funcionaban contra el mismo BO) y depuró cada falla leyendo por el MCP el detalle del paso fallido, sus
condiciones de espera y la captura que BugBug toma antes de cada paso.

| | |
|---|---|
| Proyecto BugBug | `PrestaShop` (`e5501a24-e4e8-4225-85e5-bb6aa92ead22`) |
| Sistema bajo prueba | https://app-production-91604777.up.railway.app/admin-dev/ (PrestaShop 9.3.0-dev de la rama `vv/final-project`, desplegado en Railway con una copia de la base local) |
| Navegador | Chrome 150, Linux, 1366×786, ejecución en la nube de BugBug |
| Sesión | Variables secretas del proyecto `{{boEmail}}` / `{{boPassword}}` (empleado SuperAdmin), cargadas por Tomás en BugBug |
| Datos | Marca demo `Graphic Corner`, proveedores `VV-08 Activo` y `Accessories supplier`; las pruebas que crean datos usan `{{randomNameFixed}}` |
| Fecha de ejecución | 17/11/2026 |
| Responsable | Tomás Córdoba |

## Estructura en BugBug

- **Componente `Login`**: abre `{{baseUrl}}`, escribe las variables, pulsa *Log in* y comprueba que se ve el menú
  lateral (`#nav-sidebar`). Lo reutilizan las diez pruebas que necesitan sesión.
- **Variable `baseUrl`**: `…/admin-dev/index.php` del despliegue, para no quemar la URL en ningún paso.
- **Navegación sin token**: las rutas del BO exigen `_token`; cada prueba abre la ruta directa y acepta el aviso
  *Invalid token* con «I understand the risk», como haría un usuario que entra por un enlace guardado.
- **Suite `Catálogo — RF Tomás`**: HC-01 y las diez pruebas BB-XX-YY. Reintento automático en 0, para que un defecto
  real no se repita y se lea como una prueba inestable.

## Resultados

Corrida final de la suite: `ca6e9f90-de34-4e61-8bbf-8f75dfffa226` (6 min 27 s, 11/11 aprobadas).

| ID | RF | Escenario | Tipo | Resultado esperado | Resultado obtenido | Estado | Defecto | Evidencia |
|---|---|---|---|---|---|---|---|---|
| HC-01 | — | Salud | — | La página de login del BO carga | Igual | Aprobado | | `evidencia/HC-01.webp` |
| BB-06-01 | RF-06 | ESC-06-01 | Exitoso | Crear `VV-BB Marca {{randomNameFixed}}` muestra *Successful creation* | Igual | Aprobado | | `evidencia/BB-06-01.webp` |
| BB-06-02 | RF-06 | ESC-06-03 | No exitoso | El nombre `Marca<>` se rechaza con *"Marca<>" is invalid* | Igual | Aprobado | | `evidencia/BB-06-02.webp` |
| BB-07-01 | RF-07 | ESC-07-01 | Exitoso | Filtrar por `Graphic Corner` deja exactamente una fila, la suya | Igual | Aprobado | | `evidencia/BB-07-01.webp` |
| BB-07-02 | RF-07 | ESC-07-03 | No exitoso | Filtrar por `%` responde *No records found* (el comodín se trata como texto) | Igual | Aprobado | DEF-04 (corregido) | `evidencia/BB-07-02.webp` |
| BB-08-01 | RF-08 | ESC-08-01 | Exitoso | El interruptor desactiva `VV-08 Activo` y lo vuelve a activar | Igual | Aprobado | | `evidencia/BB-08-01.webp` |
| BB-08-02 | RF-08 | ESC-08-03 | No exitoso | Sin sesión, la lista de proveedores termina en el login y no muestra la tabla | Igual | Aprobado | | `evidencia/BB-08-02.webp` |
| BB-09-01 | RF-09 | ESC-09-01 | Exitoso | Un proveedor recién creado, sin productos, se elimina con *Successful deletion* | Igual | Aprobado | | `evidencia/BB-09-01.webp` |
| BB-09-02 | RF-09 | ESC-09-02 | No exitoso | Cancelar el modal de borrado deja `Accessories supplier` en la lista | Igual | Aprobado | | `evidencia/BB-09-02.webp` |
| BB-10-01 | RF-10 | ESC-10-01 | Exitoso | Agregar `VV-BB Valor {{randomNameFixed}}` a *Composition* muestra *Successful creation* | Igual | Aprobado | | `evidencia/BB-10-01.webp` |
| BB-10-02 | RF-10 | ESC-10-02 | No exitoso | Guardar sin valor muestra *…is required at least in your default language* | Igual | Aprobado | | `evidencia/BB-10-02.webp` |

**11 pruebas: 11 aprobadas.** BB-07-02 es la reproducción automática de DEF-04 (comodines en el filtro de marcas):
pasa porque el despliegue lleva la corrección hecha por TDD; contra la línea base habría fallado. Ninguna prueba de
BugBug encontró un defecto nuevo.

## Correcciones hechas durante la ejecución

El enunciado pide usar el MCP para crear, ejecutar **y corregir**. Estas son las fallas que se debían a la prueba o al
entorno, y no a la aplicación:

| Prueba | Síntoma | Diagnóstico | Corrección |
|---|---|---|---|
| Todas (componente `Login`) | `ASSERT_FAILED` en «Se llegó al back office» con la URL ya en `AdminDashboard` | El dashboard es una página *legacy*: no tiene `#main-div`, que solo existe en las páginas Symfony | Comprobar `#nav-sidebar`, presente en todo el BO |
| Todas (componente `Login`) | Tras el login la captura vuelve al formulario con *You have been logged out for security reasons* | PrestaShop ata la cookie del empleado a su IP (`PS_COOKIE_CHECKIP`); detrás del proxy de Railway la IP vista por el servidor cambia entre peticiones | Desactivar la comprobación de IP de la cookie en la tienda desplegada (ajuste recomendado detrás de un proxy) |
| BB-06-01/02, BB-09-01, BB-10-01/02 | `ELEMENT_DOES_NOT_EXIST` en «Guardar» | El botón *Save* no declara `type="submit"`; el XPath lo exigía | XPath `//div[@id='main-div']//form//button[normalize-space()='Save']` |
| BB-06-01, BB-09-01, BB-10-01 | `FAILED_WAITING_CONDITIONS` en «Successful creation» con la marca ya creada en la captura | La página trae un `.alert-success` vacío y oculto antes del real, y BugBug tomaba el primero | Comprobar el texto en la página (`pageShowsText`) |
| BB-08-01 | `FAILED_WAITING_CONDITIONS` al comprobar el estado | Los `input` radio del interruptor `.ps-switch` están ocultos a propósito; la espera «elemento visible» nunca se cumple | Desactivar en esos dos pasos las esperas «visible» y «no cubierto» |
| BB-09-01 | `ELEMENT_DOES_NOT_EXIST` en «Delete»; la captura muestra el filtro `VV-08 ActivoVV-BB Borrar…` | Los filtros del *grid* se guardan por empleado; BB-08-01 había fallado antes de limpiar y el paso de escribir agrega texto | Paso «Vaciar el filtro de nombre» antes de cada búsqueda (cinco pruebas) |
| BB-09-01, BB-09-02 | «Delete» no visible; en la captura el puntero queda debajo del botón ⋮ | La fila queda al borde inferior del viewport y el clic por coordenadas caía fuera del botón | Abrir el menú con un paso JavaScript (`.dropdown-toggle-dots`.click()); el clic original queda desactivado con una nota |
| BB-09-02 | `ASSERT_FAILED` en «No hay mensaje de borrado» con la página correcta | `pageDoesNotShowText` + `contain` no se comporta como se espera (igual que en Beverage Ledger) | Comprobar que el modal se cerró (`.modal.show` no existe) |

## Limitaciones

- **Entorno público.** El despliegue en Railway es una copia de la base local con datos de prueba (prefijo `VV-`).
  BB-06-01, BB-09-01 y BB-10-01 crean registros con nombre aleatorio; BB-09-01 borra el suyo. BB-08-01 deja el
  proveedor en su estado inicial.
- **Datos.** BB-07-01, BB-08-01 y BB-09-02 dependen de `Graphic Corner`, `VV-08 Activo` y `Accessories supplier`.
  Si se borran o renombran, fallan por datos y no por la aplicación.
- **Evidencia.** Hay una captura por prueba, la que BugBug toma antes del último paso ejecutado. BugBug guarda la de
  cada paso en el historial de la corrida.
