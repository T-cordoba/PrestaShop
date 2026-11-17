# language: es
@juliana @rf-03
Característica: RF-03 Crear zona
  Juliana agrupa países en zonas para asignarles transportistas e impuestos.

  Antecedentes:
    Dado que Juliana inició sesión en el back office

  @esc-03-01 @exitoso
  Escenario: ESC-03-01 Crear una zona activa
    Cuando ella crea la zona "VV-SER Andina #"
    Entonces ella ve la notificación "Successful creation"

  @esc-03-02 @alternativo
  Escenario: ESC-03-02 Crear una zona inactiva
    Cuando ella crea la zona inactiva "VV-SER Inactiva #"
    Entonces ella ve la notificación "Successful creation"

  @esc-03-03 @error
  Escenario: ESC-03-03 Rechazar un nombre con marcado HTML
    Cuando ella crea la zona "<b>VV-SER</b>"
    Entonces ella ve que el formulario fue rechazado
