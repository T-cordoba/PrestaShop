# Pipeline: Jenkins + SonarQube + Docker

Pipeline de integración continua del trabajo de V&V sobre PrestaShop (RF-01..RF-10): dependencias, análisis estático,
pruebas unitarias con cobertura, análisis de SonarQube con *Quality Gate* y construcción de la imagen Docker.

Requisitos: Docker Desktop y Git. Comandos en **PowerShell**. Archivos: `Jenkinsfile`, `sonar-project.properties` y
`phpunit-vv.xml` de esta carpeta.

---

## 1. Red y volúmenes

```powershell
docker network create devops-net
docker volume create jenkins_home
docker volume create sonarqube_data
docker volume create sonarqube_logs
docker volume create sonarqube_extensions
```

## 2. Levantar Jenkins

```powershell
docker run -d --name jenkins --network devops-net -p 8080:8080 -p 50000:50000 -u root -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock --restart unless-stopped jenkins/jenkins:lts
```

## 3. Levantar SonarQube

```powershell
docker run -d --name sonarqube --network devops-net -p 9000:9000 -v sonarqube_data:/opt/sonarqube/data -v sonarqube_logs:/opt/sonarqube/logs -v sonarqube_extensions:/opt/sonarqube/extensions --restart unless-stopped sonarqube:latest
```

## 4. Docker CLI dentro de Jenkins

Las etapas corren cada herramienta en su propio contenedor (`docker run --volumes-from jenkins`), así que Jenkins solo
necesita el cliente de Docker:

```powershell
docker exec -u root jenkins bash -c 'set -e && apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates curl gnupg && install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list && apt-get update -qq && apt-get install -y -qq --no-install-recommends docker-ce-cli'
docker exec jenkins docker ps
```

## 5. Asistente de Jenkins

`http://localhost:8080`. La contraseña inicial sale con:

```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Instala los plugins sugeridos y crea tu usuario administrador.

## 6. Plugins

*Manage Jenkins → Plugins → Available*: **SonarQube Scanner** y **Timestamper**. Reinicia Jenkins.

## 7. SonarQube

1. `http://localhost:9000` con `admin` / `admin` (pide cambiar la contraseña).
2. *Create Project → Local project*: clave **`prestashop-vv`**, rama principal `vv/final-project`. El nombre visible
   («PrestaShop») lo pone el análisis desde `sonar-project.properties`.
3. *Administration → Security → Users*: crea el usuario técnico `jenkins`, dale *Execute Analysis* en *Global
   Permissions* y genera un **User Token** desde su menú ⋮ → *Tokens*.

## 8. Credencial y servidor en Jenkins

- *Manage Jenkins → Credentials → System → Global credentials → Add Credentials*: **Secret text**, ID
  `sonarqube-token`, valor = el token del paso 7.
- *Manage Jenkins → System → SonarQube servers → Add SonarQube*:

| Campo | Valor |
|---|---|
| Name | `SonarQube` |
| Server URL | `http://sonarqube:9000` |
| Server authentication token | `sonarqube-token` |

## 9. Crear el job

*New Item* → **Pipeline**, nombre `prestashop-vv`.

| Campo | Valor |
|---|---|
| Build Triggers | **Poll SCM**, `H/2 * * * *` |
| Definition | Pipeline script from SCM |
| SCM | Git, `https://github.com/T-cordoba/PrestaShop.git`, Credentials = *none* |
| Branch Specifier | `*/vv/final-project` |
| Script Path | `tests/vv/ci/Jenkinsfile` |

## 10. Lanzar

**Build Now** (o un `git push` a la rama: el *polling* lo detecta en menos de 2 minutos). Resultados:

- Jenkins: `http://localhost:8080/job/prestashop-vv/` → *Stages*, *Tests* y *Artifacts* (`tests/vv/reports/ci/`:
  JUnit, Clover y cobertura HTML).
- SonarQube: `http://localhost:9000/dashboard?id=prestashop-vv`.
- Imagen: `docker image ls prestashop-vv` (una etiqueta por número de build).

---

## Etapas del pipeline

| # | Etapa | Qué hace |
|---|---|---|
| 1 | Checkout SCM | Clona `vv/final-project` |
| 2 | Verify tools | Versión de Docker y último commit |
| 3 | Install dependencies | `composer install` en `prestashop/base:8.1-apache` |
| 4 | Static analysis | `php-cs-fixer --dry-run` sobre `tests/Unit/VV` y `tests/Integration/VV` |
| 5 | Unit tests and coverage | PHPUnit con PCOV (`phpunit-vv.xml`): JUnit + Clover |
| 6 | SonarQube analysis | `sonarsource/sonar-scanner-cli` en `devops-net` |
| 7 | Quality gate | `waitForQualityGate` (aborta si falla) |
| 8 | Docker build | `docker build -f .docker/Dockerfile -t prestashop-vv:<build>` con el CLI `docker:27-cli` (BuildKit) |

## Cobertura

Solo cuentan los archivos con pruebas **unitarias**, que son las que corren en CI: `AddressFormatChecker.php` (RF-05)
y `ManufacturerQueryBuilder.php` (RF-07), con **100 %** de líneas (build #13). El resto de las unidades bajo prueba
están en `sonar.coverage.exclusions`: sus pruebas son de integración, necesitan la base de datos de pruebas y se
ejecutan fuera del pipeline.

## Notas

- Los nombres `SonarQube`, `sonarqube-token`, la red `devops-net` y la clave `prestashop-vv` los busca el pipeline por
  nombre exacto.
- No hay webhook de SonarQube a Jenkins: la etapa 7 espera 30 s y luego consulta el resultado.
- El paso 4 vive en el contenedor, no en el volumen: repítelo si recreas `jenkins`.
- En Git Bash, `/var/run/docker.sock` se convierte en ruta de Windows y falla. Usa `//var/run/docker.sock`.
- SonarQube reiniciándose en bucle: `wsl -d docker-desktop sysctl -w vm.max_map_count=262144`.
- Con 16 GB de RAM, Jenkins + SonarQube (~3 GB) no conviven bien con el PrestaShop local y Ollama: enciéndelos por turnos.

## Apagar

```powershell
docker stop jenkins sonarqube
```
