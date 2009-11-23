#
# Component
#

# Logger used for web requests 

componentWebLoggerName = 'web-requests'

#
# Server
#

# The TCP port on which the server will start. Note that the server can
# be set up to run behind another web server via a proxy. For Apache, this
# requires mod_proxy.

serverPort = 8080

#
# Application
#

applicationName = 'Prudence Demo'
applicationDescription = 'Used to test that Prudence works for you, and useful as a basis for creating your own applications'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http:#www.threecrickets.com/prudence/'
applicationContactEmail = 'prudence@threecrickets.com'
applicationLoggerName = 'prudence-demo'

# All other URLs will be under this one.

applicationBaseURL = '/'

#
# Configuration specific to Prudence demo application
#

# Our pages will prefix this to included files. This is useful if you want to combine
# the demo site into another site.

document.meta['prudenceDemoBasePath'] = ''

#
# Resources
#
# Sets up a directory under which you can place script files that implement
# RESTful resources. The directory structure underneath the base directory
# is directly linked to the base URL.
#

resourceBaseURL = applicationBaseURL + 'resource/'
resourceBasePath = 'resources'

# Files with this extension can have the extension omitted from the URL,
# allowing for nicer URLs. 

resourceExtension = 'py'

# If the URL points to a directory rather than a file, and that directory
# contains a file with this name, then it will be used. This allows
# you to use the directory structure to create nice URLs without relying
# on filenames.

resourceDefaultName = 'default'

# This is so we can see the source code for scripts by adding ?source=true
# to the URL. You probably wouldn't want this for most applications.

resourceSourceViewable = True

# This is the time (in milliseconds) allowed to pass until a script file
# is tested to see if it was changed. During development, you'd want this
# to be low, but during production, it should be high in order to avoid
# unnecessary hits on the filesystem.

resourceMinimumTimeBetweenValidityChecks = 1000

#
# Dynamic Web
#
# Sets up a directory under which you can place text files that support embedded scriptlets.
# Note that the generated result can be cached for better performance.
#

dynamicWebBaseURL = applicationBaseURL
dynamicWebBasePath = 'web'

# Files with this extension can have the extension omitted from the URL,
# allowing for nicer URLs. 

dynamicWebExtension = 'page'


# If the URL points to a directory rather than a file, and that directory
# contains a file with this name, then it will be used. This allows
# you to use the directory structure to create nice URLs that do not
# contain filenames.

dynamicWebDefaultDocument = 'index'

# This is so we can see the source code for scripts by adding ?source=true
# to the URL. You probably wouldn't want this for most applications.

dynamicWebSourceViewable = True

# This is the time (in milliseconds) allowed to pass until a script file
# is tested to see if it was changed. During development, you'd want this
# to be low, but during production, it should be high in order to avoid
# unnecessary hits on the filesystem.

dynamicWebMinimumTimeBetweenValidityChecks = 1000

#
# Static Web
#
# Sets up a directory under which you can place static files of any type.
# Servers like Grizzly and Jetty can use non-blocking I/O to stream static
# files efficiently to clients. 
#

staticWebBaseURL = applicationBaseURL + 'static/'
staticWebBasePath = 'web/static'

# If the URL points to a directory rather than a file, then this will allow
# automatic creation of an HTML page with a directory listing.

staticWebDirectoryListingAllowed = True

#
# URL manipulation
#

# The URLs in this array will automatically be redirected to have a trailing
# slash added to them if its missing.

urlAddTrailingSlash = [staticWebBaseURL]