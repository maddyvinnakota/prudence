#
# Prudence Component
#

from java.lang import Runtime
from java.util.concurrent import Executors
from org.restlet import Component
from com.threecrickets.prudence.util import DelegatedStatusService
from com.threecrickets.prudence.cache import InProcessMemoryCache

#
# Component
#

component = Component()

component.context.attributes['com.threecrickets.prudence.version'] = prudence_version
component.context.attributes['com.threecrickets.prudence.revision'] = prudence_revision
component.context.attributes['com.threecrickets.prudence.flavor'] = prudence_flavor

#
# Logging
#

component.logService.loggerName = 'web-requests'

#
# StatusService
#

component.statusService = DelegatedStatusService()

#
# Executor
#

executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 2 + 1)
component.context.attributes['com.threecrickets.prudence.executor'] = executor

#
# Scheduler
#

component.context.attributes['com.threecrickets.prudence.scheduler'] = scheduler

#
# Cache
#

component.context.attributes['com.threecrickets.prudence.cache'] = InProcessMemoryCache()
