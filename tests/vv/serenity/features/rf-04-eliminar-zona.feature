# language: es
@juliana @rf-04
Característica: RF-04 Eliminar zona
  Juliana depura las zonas que ya no usa.

  @esc-04-01 @exitoso
  Escenario: ESC-04-01 Ubicar en el listado la zona que se va a eliminar
    Dado que Juliana inició sesión en el back office
    Cuando ella filtra el listado de zonas por name = "Europe"
    Entonces ella ve al menos una fila en el listado de zonas

  @esc-04-02 @alternativo @api
  Escenario: ESC-04-02 Consultar las zonas por la Admin API antes de eliminar
    Cuando Juliana consulta "/zones" en la Admin API
    Entonces ella recibe el código 200
    Y ella recibe una lista con al menos un elemento

  @esc-04-03 @error @api
  Escenario: ESC-04-03 Eliminar una zona inexistente
    Cuando Juliana elimina "/zones/999999" con la Admin API
    Entonces ella recibe el código 404
