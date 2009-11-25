#
# Prudence Hosts
#
# Prudence supports virtual hosting, allowing you to serve different applications
# or otherwise route differently per domain name, protocol, port, etc. This
# feature lets you run multiple sites from the same Prudence installation.
#
# Note that virtual hosts are only indirectly related to Prudence's servers.
# See servers.py for more information.
#

from org.restlet.routing import VirtualHost

#
# Wildcard
#
# Our "wildcard" host will accept all incoming requests.
#

wildcard_host = VirtualHost(component.context)
wildcard_host.name = 'wildcard'

component.hosts.add(wildcard_host)

#
# mysite.org
#
# This is an example of a virtual host which only accepts requests to
# a specific set of domains.
#

mysite_host = VirtualHost(component.context)
mysite_host.name = 'mysite.org'
mysite_host.hostScheme = 'http'
mysite_host.hostDomain = 'mysite.org|www.mysite.org'
mysite_host.hostPort = '80'

component.hosts.add(mysite_host)

#
# Default Host
#
# Applications by default will attach only to this host, though they can
# choose to attach to any hosts defined here. See the application's
# routing.js.
#

component.defaultHost = wildcard_host

#
# Welcome
#

sys.stdout.write('Available virtual hosts: ')
for i in range(len(component.hosts)):
	host = component.hosts[i]
	sys.stdout.write('"%s"' % host.name)
	if i < len(component.hosts) - 1:
		sys.stdout.write(', ')
print '.'
