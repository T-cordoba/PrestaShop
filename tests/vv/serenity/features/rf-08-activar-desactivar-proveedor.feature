# language: es
@tomas @rf-08
Característica: RF-08 Activar o desactivar proveedor
  Tomás cambia el estado de un proveedor para ocultar los que ya no usa.

  @esc-08-01 @exitoso
  Escenario: ESC-08-01 Desactivar un proveedor desde el listado y reactivarlo
    Dado que Tomás inició sesión en el back office
    Cuando él filtra el listado de proveedores por name = "Accessories supplier"
    Y él cambia el estado de la primera fila del listado de proveedores
    Entonces él ve la notificación "successfully updated"
    Cuando él cambia el estado de la primera fila del listado de proveedores
    Entonces él ve la notificación "successfully updated"

  @esc-08-02 @alternativo @api
  Escenario: ESC-08-02 Consultar el estado de un proveedor por la Admin API
    Cuando Tomás consulta "/suppliers/2" en la Admin API
    Entonces él recibe el código 200

  @esc-08-03 @error @api
  Escenario: ESC-08-03 Cambiar el estado de un proveedor inexistente
    Cuando Tomás cambia el estado de "/suppliers/999999/toggle-status" con la Admin API
    Entonces él recibe el código 404
