# language: es
@tomas @rf-10
Característica: RF-10 Agregar valor a una característica
  Como administrador del catálogo
  Quiero añadir valores a las características
  Para describir y filtrar productos

  @esc-10-01 @exitoso
  Escenario: ESC-10-01 Agregar un valor válido
    Dado que la administradora inició sesión en el back office
    Cuando abre el formulario de "valor de característica"
    Y elige la característica "Composition"
    Y escribe "VV-BDD Algodón" en el campo "valor"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-10-02 @alternativo
  Escenario: ESC-10-02 Agregar un valor de 255 caracteres
    Dado que la administradora inició sesión en el back office
    Cuando abre el formulario de "valor de característica"
    Y elige la característica "Composition"
    Y escribe un texto de 255 caracteres en el campo "valor"
    Y guarda el formulario
    Entonces ve el mensaje "Successful creation"

  @esc-10-03 @error
  Escenario: ESC-10-03 Agregar un valor a una característica inexistente
    Cuando la integración de "tomas" envía POST a "/features/values" con el cuerpo:
      """
      {"featureId": 999999, "values": {"en-US": "VV-BDD"}}
      """
    Entonces la respuesta tiene el código 404
