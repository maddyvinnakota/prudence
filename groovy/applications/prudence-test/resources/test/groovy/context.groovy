// Helper to access the context attributes

getContextAttribute = { name, getDefaultValue ->
	def value = document.container.resource.context.attributes[name]
	if(value == null) {
		value = getDefaultValue()

		// Note: another thread might have changed our value in the meantime.
		// We'll make sure there is no duplication.

		def existing = document.container.resource.context.attributes.putIfAbsent(name, value)
		if(existing != null) {
			value = existing
		}
	}
	return value
}