# language: es
@tomas @rf-10
Característica: RF-10 Agregar valor a una característica
  Tomás añade valores a las características para describir y filtrar productos.

  @esc-10-01 @exitoso
  Escenario: ESC-10-01 Agregar un valor válido
    Dado que Tomás inició sesión en el back office
    Cuando él agrega el valor "VV-SER Algodón #" a la característica "Composition"
    Entonces él ve la notificación "Successful creation"

  @esc-10-02 @alternativo @api
  Escenario: ESC-10-02 Consultar los valores de la característica por la Admin API
    Cuando Tomás consulta "/features/1/values" en la Admin API
    Entonces él recibe el código 200

  @esc-10-03 @error @api
  Escenario: ESC-10-03 Agregar un valor a una característica inexistente
    Cuando Tomás crea "/features/values" con la Admin API:
      """
      {"featureId": 999999, "values": {"en-US": "VV-SER"}}
      """
    Entonces él recibe el código 404
