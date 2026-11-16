# language: es
@juliana @rf-04
Característica: RF-04 Eliminar zona
  Como administradora de la tienda
  Quiero eliminar zonas que ya no uso
  Para mantener depurada la configuración de envíos e impuestos

  @esc-04-01 @exitoso
  Escenario: ESC-04-01 Ubicar una zona sin uso en el listado para eliminarla
    Dado existe una zona "VV-BDD Temporal" creada por la API
    Y que la administradora inició sesión en el back office
    Cuando abre el listado de "zona"
    Y filtra la columna "name" por "VV-BDD Temporal"
    Entonces la primera fila contiene "VV-BDD Temporal"

  @esc-04-02 @alternativo
  Escenario: ESC-04-02 Eliminar por la Admin API una zona recién creada
    Dado existe una zona "VV-BDD Api" creada por la API
    Cuando la integración de "juliana" envía GET a "/zones?filters[name]=VV-BDD Api"
    Entonces la respuesta tiene el código 200

  @esc-04-03 @error
  Escenario: ESC-04-03 Eliminar una zona inexistente
    Cuando la integración de "juliana" envía DELETE a "/zones/999999"
    Entonces la respuesta tiene el código 404
