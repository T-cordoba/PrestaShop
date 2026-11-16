# language: es
@tomas @rf-06
Característica: RF-06 Crear marca
  Como administrador del catálogo
  Quiero registrar marcas
  Para asociarlas a los productos

  Antecedentes:
    Dado que la administradora inició sesión en el back office
    Y abre el formulario de "marca"

  @esc-06-01 @exitoso
  Escenario: ESC-06-01 Crear una marca activa
    Cuando escribe "VV-BDD Andes" en el campo "nombre"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-06-02 @alternativo
  Escenario: ESC-06-02 Crear una marca inactiva con nombre de 64 caracteres
    Cuando escribe un texto de 64 caracteres en el campo "nombre"
    Y marca el estado como "inactivo"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-06-03 @error
  Esquema del escenario: ESC-06-03 Rechazar el nombre "<nombre>"
    Cuando escribe "<nombre>" en el campo "nombre"
    Y guarda el formulario
    Entonces el formulario se rechaza con un error de validación

    Ejemplos:
      | nombre  |
      | Marca<> |
