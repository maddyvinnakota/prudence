
//
// Configures Hazelcast using either the "/configuration/hazelcast/" script
// or the "/configuration/hazelcast.conf" file.
//

document.execute('/sincerity/container/')

// Try "/configuration/hazelcast.conf" if it exists
var config = sincerity.container.getConfigurationFile('hazelcast.conf')
if (config.exists()) {
	importClass(
		com.hazelcast.config.FileSystemXmlConfig,
		com.hazelcast.core.Hazelcast)

	config = new FileSystemXmlConfig(config)
	Hazelcast.newHazelcastInstance(config)
}
else {
	// Execute the "/configuration/hazelcast/" script
	importPackage(com.hazelcast.config)
	importClass(com.hazelcast.core.Hazelcast)
	
	config = new Config()
	
	Sincerity.Container.executeAll(sincerity.container.getConfigurationFile('hazelcast'))
	
	Hazelcast.newHazelcastInstance(config)
}