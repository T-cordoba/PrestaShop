# language: es
@juliana @rf-05
Característica: RF-05 Crear país
  Juliana registra países con su código ISO para poder vender y enviar a ellos.

  @esc-05-01 @exitoso
  Escenario: ESC-05-01 Crear un país con datos válidos
    Dado que Juliana inició sesión en el back office
    Cuando ella crea el país "VV-SER Patria #" con código ISO "Q#"
    Entonces ella ve la notificación "Successful creation"

  @esc-05-02 @alternativo @api
  Escenario: ESC-05-02 Consultar un país existente por la Admin API
    Cuando Juliana consulta "/countries/69" en la Admin API
    Entonces ella recibe el código 200

  @esc-05-03 @error
  Escenario: ESC-05-03 Rechazar un código ISO con dígitos
    Dado que Juliana inició sesión en el back office
    Cuando ella crea el país "VV-SER ISO malo #" con código ISO "X1"
    Entonces ella ve que el formulario fue rechazado
