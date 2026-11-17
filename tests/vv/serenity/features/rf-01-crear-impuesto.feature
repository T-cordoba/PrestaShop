# language: es
@juliana @rf-01
Característica: RF-01 Crear impuesto
  Como administradora de la tienda, Juliana registra impuestos con su tasa para que los precios se calculen bien.

  Antecedentes:
    Dado que Juliana inició sesión en el back office

  @esc-01-01 @exitoso
  Escenario: ESC-01-01 Crear un impuesto activo con datos válidos
    Cuando ella crea el impuesto "VV-SER IVA #" con tasa "19"
    Entonces ella ve la notificación "Successful creation"

  @esc-01-02 @alternativo
  Escenario: ESC-01-02 Crear un impuesto exento e inactivo
    Cuando ella crea el impuesto inactivo "VV-SER Exento #" con tasa "0"
    Entonces ella ve la notificación "Successful creation"

  @esc-01-03 @error
  Escenario: ESC-01-03 Rechazar una tasa negativa
    Cuando ella crea el impuesto "VV-SER Negativo #" con tasa "-5"
    Entonces ella ve que el formulario fue rechazado
