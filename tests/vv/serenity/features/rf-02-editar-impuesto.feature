# language: es
@juliana @rf-02
Característica: RF-02 Editar impuesto
  Juliana cambia la tasa o el estado de un impuesto existente.

  @esc-02-01 @exitoso @api
  Escenario: ESC-02-01 Modificar un impuesto existente por la Admin API
    Cuando Juliana modifica "/taxes/1" con la Admin API:
      """
      {"rate": "20"}
      """
    Entonces ella recibe el código 200

  @esc-02-02 @alternativo
  Escenario: ESC-02-02 Cambiar el estado de un impuesto desde el listado y restaurarlo
    Dado que Juliana inició sesión en el back office
    Cuando ella filtra el listado de impuestos por name = "TVA FR 10"
    Y ella cambia el estado de la primera fila del listado de impuestos
    Entonces ella ve la notificación "successfully updated"
    Cuando ella cambia el estado de la primera fila del listado de impuestos
    Entonces ella ve la notificación "successfully updated"

  @esc-02-03 @error @api
  Escenario: ESC-02-03 Editar un impuesto inexistente
    Cuando Juliana modifica "/taxes/999999" con la Admin API:
      """
      {"rate": "21"}
      """
    Entonces ella recibe el código 404
