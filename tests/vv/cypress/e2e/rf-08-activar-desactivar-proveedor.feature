# language: es
@tomas @rf-08
Característica: RF-08 Activar o desactivar proveedor
  Como administrador del catálogo
  Quiero cambiar el estado de un proveedor
  Para ocultar los proveedores con los que ya no trabajo

  @esc-08-01 @exitoso
  Escenario: ESC-08-01 Desactivar un proveedor desde el listado
    Dado existe un proveedor "VV-BDD Proveedor" creado por la API
    Y que la administradora inició sesión en el back office
    Cuando abre el listado de "proveedor"
    Y filtra la columna "name" por "VV-BDD Proveedor"
    Y cambia el estado de la primera fila
    Entonces ve el mensaje "successfully updated"

  @esc-08-02 @alternativo
  Escenario: ESC-08-02 Consultar el estado de un proveedor por la Admin API
    Dado existe un proveedor "VV-BDD Consulta" creado por la API
    Cuando la integración de "tomas" envía GET a "/suppliers?filters[name]=VV-BDD Consulta"
    Entonces la respuesta tiene el código 200

  @esc-08-03 @error
  Escenario: ESC-08-03 Cambiar el estado de un proveedor inexistente
    Cuando la integración de "tomas" envía PUT a "/suppliers/999999/toggle-status"
    Entonces la respuesta tiene el código 404
