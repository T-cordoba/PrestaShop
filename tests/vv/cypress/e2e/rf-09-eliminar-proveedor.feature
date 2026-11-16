# language: es
@tomas @rf-09
Característica: RF-09 Eliminar proveedor
  Como administrador del catálogo
  Quiero eliminar proveedores
  Para depurar el catálogo

  @esc-09-01 @exitoso
  Escenario: ESC-09-01 Ubicar un proveedor sin productos para eliminarlo
    Dado existe un proveedor "VV-BDD Borrar" creado por la API
    Y que la administradora inició sesión en el back office
    Cuando abre el listado de "proveedor"
    Y filtra la columna "name" por "VV-BDD Borrar"
    Entonces la primera fila contiene "VV-BDD Borrar"

  @esc-09-02 @alternativo
  Escenario: ESC-09-02 Consultar un proveedor por la Admin API antes de eliminarlo
    Dado existe un proveedor "VV-BDD Antes" creado por la API
    Cuando la integración de "tomas" envía GET a "/suppliers?filters[name]=VV-BDD Antes"
    Entonces la respuesta tiene el código 200

  @esc-09-03 @error
  Escenario: ESC-09-03 Eliminar un proveedor inexistente
    Cuando la integración de "tomas" envía DELETE a "/suppliers/999999"
    Entonces la respuesta tiene el código 404
