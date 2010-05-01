<?php
//
// Prudence Application Settings
//

global $component;
global $applicationName, $applicationDescription, $applicationAuthor, $applicationHomeURL, $applicationContactEmail;
global $showDebugOnError, $showSourceCodeURL;
global $applicationLoggerName;
global $hosts;
global $resourcesBaseURL, $resourcesBasePath, $resourcesDefaultName, $resourcesDefrost, $resourcesSourceViewable, $resourcesMinimumTimeBetweenValidityChecks;
global $dynamicWebBaseURL, $dynamicWebBasePath, $dynamicWebDefaultDocument, $dynamicWebDefrost, $dynamicWebPreheat, $dynamicWebSourceViewable, $dynamicWebMinimumTimeBetweenValidityChecks;
global $staticWebBaseURL, $staticWebBasePath, $staticWebDirectoryListingAllowed;
global $preheatResources;
global $urlAddTrailingSlash;
global $runtimeAttributes;

//
// Information
//
// These are for administrative purposes only.
//

//$applicationName = 'Prudence Application'; // Defaults to the application directory name
$applicationDescription = 'This is a Prudence application.';
$applicationAuthor = 'Anonymous';
$applicationOwner = 'Public Domain';
$applicationHomeURL = 'http://threecrickets.com/prudence/';
$applicationContactEmail = 'prudence@threecrickets.com';

//
// Debugging
//

// Set to true to show debug information on error.

$showDebugOnError = false;

// The base URL for showing source code (only relevant when showDebugOnError is true). 

$showSourceCodeURL = '/sourcecode/';

//
// Logging
//
// Logger defaults to the application's directory name. Configure logging at
// conf/logging.conf.
//

//$applicationLoggerName = 'prudence-application';

//
// Hosts
//
// This is a vector of vectors of two elements: the first is the virtual hosts to which,
// our application will be attached, the second is the base URLs on the hosts. See
// component/hosts.py for more information. Specify None for the URL to default to the
// application's directory name.
//

$hosts = array(array($component->defaultHost, null));

//
// Resources
//
// Sets up a directory under which you can place script files that implement
// RESTful resources. The directory structure underneath the base directory
// is directly linked to the base URL.
//

$resourcesBaseURL = '/';
$resourcesBasePath = '/resources/';

// If the URL points to a directory rather than a file, and that directory
// contains a file with this name, then it will be used. This allows
// you to use the directory structure to create nice URLs without relying
// on filenames.

$resourcesDefaultName = 'default';

// Set this to true if you want to start to load and compile your
// resources as soon as Prudence starts.

$resourcesDefrost = true;

// This is so we can see the source code for scripts by adding ?source=true
// to the URL. You probably wouldn't want this for most applications.

$resourcesSourceViewable = true;

// This is the time (in milliseconds) allowed to pass until a script file
// is tested to see if it was changed. During development, you'd want this
// to be low, but during production, it should be high in order to avoid
// unnecessary hits on the filesystem.

$resourcesMinimumTimeBetweenValidityChecks = 1000;

//
// Dynamic Web
//
// Sets up a directory under which you can place text files that support embedded scriptlets.
// Note that the generated result can be cached for better performance.
//

$dynamicWebBaseURL = '/';
$dynamicWebBasePath = '/web/dynamic/';

// If the URL points to a directory rather than a file, and that directory
// contains a file with this name, then it will be used. This allows
// you to use the directory structure to create nice URLs that do not
// contain filenames.

$dynamicWebDefaultDocument = 'index';

// Set this to true if you want to compile your scriptlets as soon as Prudence
// starts.

$dynamicWebDefrost = true;

// Set this to true if you want to load all your dynamic web documents as soon
// as Prudence starts.

$dynamicWebPreheat = true;

// This is so we can see the source code for scripts by adding ?source=true
// to the URL. You probably wouldn't want this for most applications.

$dynamicWebSourceViewable = true;

// This is the time (in milliseconds) allowed to pass until a script file
// is tested to see if it was changed. During development, you'd want this
// to be low, but during production, it should be high in order to avoid
// unnecessary hits on the filesystem.

$dynamicWebMinimumTimeBetweenValidityChecks = 1000;

//
// Static Web
//
// Sets up a directory under which you can place static files of any type.
// Servers like Grizzly and Jetty can use non-blocking I/O to stream static
// files efficiently to clients. 
//

$staticWebBaseURL = '/';
$staticWebBasePath = '/web/static/';

// If the URL points to a directory rather than a file, then this will allow
// automatic creation of an HTML page with a directory listing.

$staticWebDirectoryListingAllowed = true;

//
// Preheater
//
// List resources here that you want heated up as soon as Prudence starts.
//

$preheatResources = array();

//
// URL manipulation
//

// The URLs in this array will automatically be redirected to have a trailing
// slash added to them if it's missing.

$urlAddTrailingSlash = array($dynamicWebBaseURL, $staticWebBaseURL);

//
// Runtime Attributes
//
// These will be available to your code via the application's context.
//

$runtimeAttributes = array();
?>