# language: es
@tomas @rf-09
Característica: RF-09 Eliminar proveedor
  Tomás depura los proveedores del catálogo.

  @esc-09-01 @exitoso
  Escenario: ESC-09-01 Ubicar en el listado el proveedor que se va a eliminar
    Dado que Tomás inició sesión en el back office
    Cuando él filtra el listado de proveedores por name = "Fashion supplier"
    Entonces él ve 1 fila en el listado de proveedores

  @esc-09-02 @alternativo @api
  Escenario: ESC-09-02 Consultar los proveedores por la Admin API
    Cuando Tomás consulta "/suppliers" en la Admin API
    Entonces él recibe el código 200
    Y él recibe una lista con al menos un elemento

  @esc-09-03 @error @api
  Escenario: ESC-09-03 Eliminar un proveedor inexistente
    Cuando Tomás elimina "/suppliers/999999" con la Admin API
    Entonces él recibe el código 404
