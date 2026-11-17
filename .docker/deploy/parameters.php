<?php
// Secrets come from the environment, never from the image: PS_PARAMETERS_B64 holds the base64 JSON of the
// installed parameters, and Railway's MySQL variables override the database connection.
$parameters = json_decode(base64_decode((string) getenv('PS_PARAMETERS_B64')), true) ?: [];
foreach ([
    'database_host' => 'MYSQLHOST',
    'database_port' => 'MYSQLPORT',
    'database_name' => 'MYSQLDATABASE',
    'database_user' => 'MYSQLUSER',
    'database_password' => 'MYSQLPASSWORD',
] as $key => $variable) {
    if (false !== getenv($variable)) {
        $parameters[$key] = getenv($variable);
    }
}
$parameters['use_debug_toolbar'] = false;

return ['parameters' => $parameters];
