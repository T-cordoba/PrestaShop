# language: es
@juliana @rf-05
Característica: RF-05 Crear país
  Como administradora de la tienda
  Quiero registrar países con su código ISO y formato postal
  Para poder vender y enviar a ellos

  Antecedentes:
    Dado que la administradora inició sesión en el back office
    Y abre el formulario de "país"

  @esc-05-01 @exitoso
  Escenario: ESC-05-01 Crear un país con datos válidos
    Cuando escribe "VV-BDD Patria" en el campo "nombre"
    Y escribe "QB" en el campo "código ISO"
    Y escribe "57" en el campo "prefijo"
    Y elige "South America" en la zona
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-05-02 @alternativo
  Escenario: ESC-05-02 Crear un país con ISO de tres letras y formato postal
    Cuando escribe "VV-BDD Tres" en el campo "nombre"
    Y escribe "QBZ" en el campo "código ISO"
    Y escribe "58" en el campo "prefijo"
    Y elige "South America" en la zona
    Y exige código postal
    Y escribe "NNNNN-LLLLLL" en el campo "formato postal"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-05-03 @error
  Esquema del escenario: ESC-05-03 Rechazar el código ISO "<iso>"
    Cuando escribe "VV-BDD ISO malo" en el campo "nombre"
    Y escribe "<iso>" en el campo "código ISO"
    Y escribe "57" en el campo "prefijo"
    Y guarda el formulario
    Entonces el formulario se rechaza con un error de validación

    Ejemplos:
      | iso  |
      | X1   |
      | XQZW |
