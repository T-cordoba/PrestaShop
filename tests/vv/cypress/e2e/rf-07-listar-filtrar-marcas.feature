# language: es
@tomas @rf-07
Característica: RF-07 Listar y filtrar marcas
  Como administrador del catálogo
  Quiero filtrar el listado de marcas
  Para encontrar una marca entre muchas

  Antecedentes:
    Dado existe una marca "VV-BDDL Uno" creada por la API
    Y que la administradora inició sesión en el back office
    Y abre el listado de "marca"

  @esc-07-01 @exitoso
  Escenario: ESC-07-01 Filtrar por el nombre
    Cuando filtra la columna "name" por "VV-BDDL Uno"
    Entonces la primera fila contiene "VV-BDDL Uno"

  @esc-07-02 @alternativo
  Escenario: ESC-07-02 Filtrar sin coincidencias
    Cuando filtra la columna "name" por "zzzz-no-existe"
    Entonces el listado no tiene resultados

  @esc-07-03 @error
  Escenario: ESC-07-03 Un comodín se trata como texto literal
    Cuando filtra la columna "name" por "%"
    Entonces el listado no tiene resultados
