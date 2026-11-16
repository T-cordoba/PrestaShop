# language: es
@juliana @rf-03
Característica: RF-03 Crear zona
  Como administradora de la tienda
  Quiero agrupar países en zonas
  Para asignarles transportistas e impuestos

  Antecedentes:
    Dado que la administradora inició sesión en el back office
    Y abre el formulario de "zona"

  @esc-03-01 @exitoso
  Escenario: ESC-03-01 Crear una zona activa
    Cuando escribe "VV-BDD Andina" en el campo "nombre"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-03-02 @alternativo
  Escenario: ESC-03-02 Crear una zona inactiva con nombre de 64 caracteres
    Cuando escribe un texto de 64 caracteres en el campo "nombre"
    Y marca el estado como "inactivo"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-03-03 @error
  Escenario: ESC-03-03 Rechazar un nombre con marcado HTML
    Cuando escribe "<script>alert(1)</script>" en el campo "nombre"
    Y guarda el formulario
    Entonces el formulario se rechaza con un error de validación
