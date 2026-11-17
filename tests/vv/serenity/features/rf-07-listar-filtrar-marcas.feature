# language: es
@tomas @rf-07
Característica: RF-07 Listar y filtrar marcas
  Tomás filtra el listado de marcas para encontrar una entre muchas.

  Antecedentes:
    Dado que Tomás inició sesión en el back office

  @esc-07-01 @exitoso
  Escenario: ESC-07-01 Filtrar por una parte del nombre
    Cuando él filtra el listado de marcas por name = "Studio"
    Entonces él ve que el listado de marcas incluye "Studio Design"

  @esc-07-02 @alternativo
  Escenario: ESC-07-02 Filtrar sin coincidencias
    Cuando él filtra el listado de marcas por name = "zzzz-no-existe"
    Entonces él ve 0 filas en el listado de marcas

  @esc-07-03 @error
  Escenario: ESC-07-03 Un comodín se trata como texto literal
    Cuando él filtra el listado de marcas por name = "%"
    Entonces él ve 0 filas en el listado de marcas
