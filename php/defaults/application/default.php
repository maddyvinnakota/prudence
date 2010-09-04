<?php
//
// Prudence Application
//

global $application_instance, $application_globals, $language_manager;
global $application_name, $application_description, $application_author, $application_owner, $application_home_url, $application_contact_email;
global $tasks_base_path, $tasks_default_name, $tasks_minimum_time_between_validity_checks;
global $show_debug_on_error, $show_source_code_url;
global $application_logger_name, $application_base, $application_base_path;
global $predefined_globals;
global $scheduler;

import org.restlet.data.Reference;
import org.restlet.data.MediaType;
import com.threecrickets.prudence.DelegatedStatusService;
import com.threecrickets.prudence.ApplicationTaskCollector;

//
// Settings
//

execute_or_default($application_base . '/settings/', 'defaults/application/settings/');

//
// Application
//

execute_or_default($application_base . '/application/', 'defaults/application/application/');

$application_instance->name = $application_name;
$application_instance->description = $application_description;
$application_instance->author = $application_author;
$application_instance->owner = $application_owner;

//
// StatusService
//

$application_instance->statusService = new DelegatedStatusService($show_debug_on_error ? $show_source_code_url : null);
$application_instance->statusService->debugging = $show_debug_on_error;
$application_instance->statusService->homeRef = new Reference($application_home_url);
$application_instance->statusService->contactEmail = $application_contact_email;

//
// MetaData
//

$application_instance->metadataService->addExtension('php', MediaType::valueOf('text/html'));

//
// Routing
//

execute_or_default($application_base . '/routing/', 'defaults/application/routing/');

//
// Logging
//

$application_instance->context->setLogger($application_logger_name);

//
// Predefined Globals
//

foreach($predefined_globals as $key => $value) {
	$application_globals[$key] = $value;
}

//
// Tasks
//

$tasks_document_source = new DocumentFileSource($application_base_path . $tasks_base_path, $tasks_default_name, 'php', $tasks_minimum_time_between_validity_checks);
$application_globals['com.threecrickets.prudence.ApplicationTask.languageManager'] = $language_manager;
$application_globals['com.threecrickets.prudence.ApplicationTask.defaultLanguageTag'] = 'php';
$application_globals['com.threecrickets.prudence.ApplicationTask.defaultName'] = $tasks_default_name;
$application_globals['com.threecrickets.prudence.ApplicationTask.documentSource'] = $tasks_document_source;
$scheduler->addTaskCollector(new ApplicationTaskCollector(new File($application_base_path . '/crontab'), $application_instance));
?>