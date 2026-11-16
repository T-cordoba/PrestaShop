# language: es
@juliana @rf-01
Característica: RF-01 Crear impuesto
  Como administradora de la tienda
  Quiero registrar impuestos con su tasa
  Para que los precios se calculen con el impuesto correcto

  Antecedentes:
    Dado que la administradora inició sesión en el back office
    Y abre el formulario de "impuesto"

  @esc-01-01 @exitoso
  Escenario: ESC-01-01 Crear un impuesto activo con datos válidos
    Cuando escribe "VV-BDD IVA 19" en el campo "nombre"
    Y escribe "19" en el campo "tasa"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-01-02 @alternativo
  Escenario: ESC-01-02 Crear un impuesto exento inactivo con valores límite
    Cuando escribe un texto de 32 caracteres en el campo "nombre"
    Y escribe "0" en el campo "tasa"
    Y marca el estado como "inactivo"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-01-03 @error
  Esquema del escenario: ESC-01-03 Rechazar una tasa inválida "<tasa>"
    Cuando escribe "VV-BDD tasa invalida" en el campo "nombre"
    Y escribe "<tasa>" en el campo "tasa"
    Y guarda el formulario
    Entonces el formulario se rechaza con un error de validación

    Ejemplos:
      | tasa    |
      | abc     |
      | 13.9255 |
      | -5      |
