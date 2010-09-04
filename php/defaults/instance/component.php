<?php
//
// Prudence Component
//

import java.lang.Runtime;
import java.util.concurrent.Executors;
import org.restlet.Component;
import com.threecrickets.prudence.DelegatedStatusService;
import com.threecrickets.prudence.cache.InProcessMemoryCache;
import it.sauronsoftware.cron4j.Scheduler;

global $executable;
global $component, $executor, $scheduler, $prudence_version, $prudence_revision, $prudence_flavor;

//
// Component
//

$component = new Component();
$executable->globals['com.threecrickets.prudence.component'] = $component;

$component->context->attributes['com.threecrickets.prudence.version'] = $prudence_version;
$component->context->attributes['com.threecrickets.prudence.revision'] = $prudence_revision;
$component->context->attributes['com.threecrickets.prudence.flavor'] = $prudence_flavor;

//
// Logging
//

$component->logService->loggerName = 'web-requests';

//
// StatusService
//

$component->statusService = new DelegatedStatusService();

//
// Executor
//

$executor = Executors::newScheduledThreadPool(Runtime::getRuntime()->availableProcessors() * 2 + 1);
$component->context->attributes['com.threecrickets.prudence.executor'] = $executor;
$tasks = array();

//
// Scheduler
//

$scheduler = new Scheduler();
$component->context->attributes['com.threecrickets.prudence.scheduler'] = $scheduler;

//
// Cache
//

$component->context->attributes['com.threecrickets.prudence.cache'] = new InProcessMemoryCache();
?>