// Helper to access the context attributes

function getContextAttribute(name, getDefaultValue) {
	var value = document.container.resource.context.attributes.get(name);
	if(value == null) {
		value = getDefaultValue();

		// Note: another thread might have changed our value in the meantime.
		// We'll make sure there is no duplication.

		var existing = document.container.resource.context.attributes.putIfAbsent(name, value);
		if(existing != null) {
			value = existing;
		}
	}
	return value;
}