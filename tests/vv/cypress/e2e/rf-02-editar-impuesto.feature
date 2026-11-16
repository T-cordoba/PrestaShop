# language: es
@juliana @rf-02
Característica: RF-02 Editar impuesto
  Como administradora de la tienda
  Quiero modificar la tasa o el estado de un impuesto
  Para reflejar los cambios de la ley

  @esc-02-01 @exitoso
  Escenario: ESC-02-01 Cambiar la tasa de un impuesto existente
    Dado existe un impuesto "VV-BDD Editable" creado por la API
    Cuando la integración de "juliana" modifica el impuesto creado con el cuerpo:
      """
      {"rate": "21"}
      """
    Entonces la respuesta tiene el código 200

  @esc-02-02 @alternativo
  Escenario: ESC-02-02 Cambiar el estado desde el listado
    Dado existe un impuesto "VV-BDD Estado" creado por la API
    Y que la administradora inició sesión en el back office
    Cuando abre el listado de "impuesto"
    Y filtra la columna "name" por "VV-BDD Estado"
    Y cambia el estado de la primera fila
    Entonces ve el mensaje "successfully updated"

  @esc-02-03 @error
  Escenario: ESC-02-03 Editar un impuesto inexistente
    Cuando la integración de "juliana" envía PATCH a "/taxes/999999" con el cuerpo:
      """
      {"rate": "21"}
      """
    Entonces la respuesta tiene el código 404
