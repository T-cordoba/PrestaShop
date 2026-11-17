# language: es
@tomas @rf-06
Característica: RF-06 Crear marca
  Tomás registra marcas para asociarlas a los productos.

  Antecedentes:
    Dado que Tomás inició sesión en el back office

  @esc-06-01 @exitoso
  Escenario: ESC-06-01 Crear una marca activa
    Cuando él crea la marca "VV-SER Andes #"
    Entonces él ve la notificación "Successful creation"

  @esc-06-02 @alternativo
  Escenario: ESC-06-02 Crear una marca inactiva
    Cuando él crea la marca inactiva "VV-SER Inactiva #"
    Entonces él ve la notificación "Successful creation"

  @esc-06-03 @error
  Escenario: ESC-06-03 Rechazar un nombre con caracteres prohibidos
    Cuando él crea la marca "Marca<>"
    Entonces él ve que el formulario fue rechazado
