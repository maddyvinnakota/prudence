<?php
//
// Stickstick Settings
//

global $component, $hosts, $defaultHost, $mysiteHost;
global $applicationName, $applicationDescription, $applicationAuthor, $applicationHomeURL, $applicationContactEmail;
global $runtimeAttributes, $showDebugOnError, $preheatResources;

$executable->container->include('defaults/application/settings/');

$applicationName = 'Stickstick';
$applicationDescription = 'Share online sticky notes';
$applicationAuthor = 'Tal Liron';
$applicationOwner = 'Three Crickets';
$applicationHomeURL = 'http://threecrickets.com/prudence/stickstick/';
$applicationContactEmail = 'prudence@threecrickets.com';

$runtimeAttributes['stickstick.backend'] = 'h2';
$runtimeAttributes['stickstick.username'] = 'root';
$runtimeAttributes['stickstick.password'] = 'root';
$runtimeAttributes['stickstick.host'] = '';
$runtimeAttributes['stickstick.database'] = 'data/h2/stickstick';

$showDebugOnError = true;

$preheatResources = array('data/');
?>