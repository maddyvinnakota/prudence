//
// This file is part of the Prudence Foundation Library
//
// Copyright 2009-2017 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.require(
	'/prudence/logging/',
	'/sincerity/xml/',
	'/sincerity/objects/',
	'/sincerity/platform/',
	'/sincerity/json/',
	'/sincerity/jvm/')

var Prudence = Prudence || {}

/**
 * Flexible, JavaScript-friendly wrapper over Prudence's Restlet-based
 * RESTful client, with support for external and internal resources, parsing and
 * packing of JSON, XML, property sheet and web-form formats, as well as direct
 * passing of JVM objects to internal resources with no serialization.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.4
 */
Prudence.Resources = Prudence.Resources || function() {
	/** @exports Public as Prudence.Resources */
	var Public = {}

	/**
	 * The library's logger.
	 *
	 * @field
	 * @returns {Prudence.Logging.Logger}
	 */
	Public.logger = Prudence.Logging.getLogger('resources')
	
	/**
	 * HTTP status codes.
	 * 
	 * @namespace
	 */
	Public.Status = {
		/** @namespace */
		Information: {
			/** @constant */
			Continue: 100,
			/** @constant */
			SwitchingProtocols: 101
		},
		/** @namespace */
		Success: {
			/** @constant */
			OK: 200,
			/** @constant */
			Created: 201,
			/** @constant */
			Accepted: 202,
			/** @constant */
			NonAuthorative: 203,
			/** @constant */
			NoContent: 204,
			/** @constant */
			ResetContent: 205,
			/** @constant */
			PartialContent: 206
		},
		/** @namespace */
		Redirect: {
			/** @constant */
			Multiple: 300,
			/** @constant */
			Permanent: 301,
			/** @constant */
			Found: 302,
			/** @constant */
			SeeOther: 303,
			/** @constant */
			NotModified: 304,
			/** @constant */
			UseProxy: 305,
			/** @constant */
			Temporary: 307
		},
		/** @namespace */
		ClientError: {
			/** @constant */
			BadRequest: 400,
			/** @constant */
			Unauthorized: 401,
			/** @constant */
			PaymentRequired: 402,
			/** @constant */
			Forbidden: 403,
			/** @constant */
			NotFound: 404,
			/** @constant */
			MethodNotAllowed: 405,
			/** @constant */
			NotAcceptable: 406,
			/** @constant */
			ProxyAuthenticationRequired: 407,
			/** @constant */
			RequestTimeout: 408,
			/** @constant */
			Conflict: 409,
			/** @constant */
			Gone: 410,
			/** @constant */
			LengthRequired: 411,
			/** @constant */
			PreconditionFailed: 412,
			/** @constant */
			EntityTooLarge: 413,
			/** @constant */
			UriTooShort: 414,
			/** @constant */
			UnsupportedMediaType: 415,
			/** @constant */
			RangeNotSatisfiable: 416,
			/** @constant */
			ExpectationFailed: 417
		},
		/** @namespace */
		ServerError: {
			/** @constant */
			Internal: 500,
			/** @constant */
			NotImplemented: 501,
			/** @constant */
			BadGateway: 502,
			/** @constant */
			ServiceUnavailable: 503,
			/** @constant */
			GatewayTimeout: 504,
			/** @constant */
			HttpVersionNotSupported: 505
		}
	}

	/**
	 * True if the client is mobile (likely a phone or a tablet).
	 * <p>
	 * The client can set the mode explicitly via mode=mobile or mode=desktop query params.
	 * 
	 * @param conversation The Prudence conversation
	 * @returns {Boolean}
	 */
	Public.isMobileClient = function(conversation) {
		var mode = conversation.query.get('mode')
		switch (String(mode)) {
			case 'mobile':
				return true
			case 'desktop':
				return false
		}
		
		var agent = conversation.request.clientInfo.agent
		return Sincerity.Objects.exists(agent) && (agent.toLowerCase().indexOf('mobile') != -1)
	}

	/**
	 * Encodes a URL component. Note that JavaScript's standard encodeURIComponent will not encode !'()*~.
	 * 
	 * @returns {String}
	 */
	Public.encodeUrlComponent = function(string) {
		return encodeURIComponent(string).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/~/g, '%7E')
	}
	
	/**
	 * Gets the client's IP address (upstream of any filters, proxies or gateways).
	 * 
	 * @param conversation The Prudence conversation
	 * @returns {Object} Dict in the form of {ip: 'ip address', hostName: 'host name'}
	 */
	Public.getClientAddress = function(conversation) {
		var address = {}
		address.ip = String(conversation.resource.request.clientInfo.upstreamAddress)
		var inetAddress = java.net.InetAddress.getByName(address.ip)
		if (inetAddress) {
			address.hostName = String(inetAddress.hostName)
		}
		return address
	}
	
	/**
	 * Extracts query parameters, treating them as specific types.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [keys] See {@link Prudence.Resources#fromAttributeMap}
	 * @returns {Object} A dict of query parameters
	 * @see Visit <a href="http://threecrickets.com/api/javascript/?namespace=conversation&item=conversation.query">the Prudence API documentation for conversation.query</a>
	 */
	Public.getQuery = function(conversation, keys) {
		return Public.fromAttributeMap(conversation.query, conversation.queryAll, keys)
	}

	/**
	 * Extracts form parameters, treating them as specific types.
	 * The form data is submitted by the client as an "application/x-www-form-urlencoded" entity.
	 * <p>
	 * See {@link Diligence.Forms.Form} for a more comprehensive solution to handling forms.
	 * 
	 * @param conversation The Prudence conversation
	 * @param [keys] See {@link Prudence.Resources#fromAttributeMap}
	 * @returns {Object} A dict of form parameters
	 * @see Visit <a href="http://threecrickets.com/api/javascript/?namespace=conversation&item=conversation.form">the Prudence API documentation for conversation.form</a>
	 */
	Public.getForm = function(conversation, keys) {
		return Public.fromAttributeMap(conversation.form, conversation.formAll, keys)
	}
	
	/**
	 * Extracts the entity, treating it as a specific type.
	 * 
	 * @param conversation The Prudence conversation
	 * @param {String} type See {@link Prudence.Resources#fromRepresentation}
	 * @param [params] Optional params for some conversions
	 * @returns The entity
	 */
	Public.getEntity = function(conversation, type, params) {
		return Sincerity.Objects.exists(conversation.entity) ? Public.fromRepresentation(conversation.entity, type, params) : null
	}
	
	/**
	 * True if the reference's relative path starts with any of the prefixes. 
	 * 
	 * @param conversation The Prudence conversation
	 * @param {String[]} prefixes An array of prefixes
	 * @returns {Boolean}
	 */
	Public.hasRelativePrefix = function(conversation, prefixes) {
		if (prefixes) {
			var relative = conversation.reference.relativeRef.toString()
			if (relative.length && (relative.charAt(0) != '/')) {
				relative = '/' + relative
			}
			prefixes = Sincerity.Objects.array(prefixes)
			for (var p in prefixes) {
				if (relative.startsWith(prefixes[p])) {
					return true
				}
			}
		}
		
		return false
	}

	/**
	 * Sends a request to a resource, with support for various types of representation and payload conversions.
	 * 
	 * @param params
	 * @param {String} params.uri The URI; if it begins with '/' will act as if params.internal is true
	 * @param {String|<a href="http://docs.oracle.com/javase/6/docs/api/index.html?java/io/File.html">java.io.File</a>} [params.file] File path or file objects; if used, will be converted to a file:// URI
	 * @param [params.query] The query parameters to add to the URI (see {@link Prudence.Resources#buildUri})
	 * @param {String} [params.method='get'] The HTTP method: 'get', 'post', 'put', 'delete' or 'head'
	 * @param {Boolean|String} [params.internal=false] True to use Prudence's document.internal API; a string here
	 *		  specifies the internal application name to use
	 * @param {String} [params.mediaType] Defaults to 'application/internal' for internal=true, otherwise 'text/plain'
	 * @param [params.payload] The payload
	 * @param {String} [params.payload.type] Supported payload types:
	 *		<ul>
	 *		<li>'text': converted to string if not one already</li>
	 *		<li>'json': see {@link Sincerity.JSON#to}</li>
	 *		<li>'xml': see {@link Sincerity.XML#to}</li>
	 *		<li>'web': see {@link Prudence.Resources#toWebPayload}</li>
	 *		<li>'binary': an array of bytes</li>
	 *		<li>'object': a JVM-serializable object</li>
	 *		<li>'internal': as is (only for internal=true)</li>
	 *		</ul>
	 * @param {String} [params.payload.value] The payload value
	 * @param {String} [params.payload.mediaType] The payload mediaType (overrides the default value)
	 * @param [params.headers] A dict of custom headers to add to the request 
	 * @param {String|Object} [params.result]
	 *		Defaults to 'json' for JSON media types, 'xml' for XML media types, 'object' for 'application/object', 
	 *		'internal' for 'application/internal' and 'text' for everything else. Supported types:
	 *		<ul>
	 *		<li>'text': the default (for non-'head' methods)</li>
	 *		<li>'entity': the Restlet Representation instance (make sure to release it!)</li>
	 *		<li>'date': the Date from the response header</li>
	 *		<li>'json': see {@link Sincerity.JSON#from}</li>
	 *		<li>'extendedJson': see {@link Sincerity.JSON#from}</li>
	 *		<li>'xml': see {@link Sincerity.XML#from}</li>
	 *		<li>'web': see {@link Prudence.Resources#fromQueryString}</li>
	 *		<li>'binary': an array of bytes</li>
	 *		<li>'properties': see {@link Prudence.Resources#fromPropertySheet} (using params.separator)</li>
	 *		<li>'object': a JVM-serializable object</li>
	 *		<li>'internal': an arbitrary object (only useful for internal conversations)</li>
	 *		</ul>
	 * @param {String|Object} [params.result.type] As params.result
	 * @param {Boolean} [params.result.headers] If true, the result will be in the form of {headers:{}, representation:...}
	 *		where 'headers' is a dict of HTTP responses; params.results.headers defaults to true if params.method is 'head',
	 *		otherwise it defaults to false
	 * @param [params.authorization] A dict in the form of {type: 'scheme name', ...}.
	 *		For example: {type: 'oauth', rawValue: 'oauth authorization'}. If 'type' is not supported by a specialized helper,
	 *      then it will translate to a simple 'Authorization' header, e.g. {type: 'Bearer', rawValue: '12345'} 
	 * @param {Number} [params.retry=0] Number of retries in case of failed requests
	 * @param [params.logLevel='fine'] The log level to use for failed requests
	 */
	Public.request = function(params) {
		params = Sincerity.Objects.clone(params)
		params.logLevel = params.logLevel || 'fine'
		params.method = params.method || 'get'
		if (Sincerity.Objects.exists(params.uri)) {
			params.uri = String(params.uri)
		}
		if (!Sincerity.Objects.exists(params.internal) && Sincerity.Objects.exists(params.uri) && (params.uri[0] == '/')) {
			params.internal = true
		}
		params.mediaType = params.mediaType || (params.internal ? 'application/internal' : 'text/plain')

		var resultType
		var resultHeaders
		if (Sincerity.Objects.exists(params.result)) {
			resultType = Sincerity.Objects.isString(params.result) ? String(params.result) : params.result.type
			resultHeaders = params.result.headers
		}
		if (!Sincerity.Objects.exists(resultType)) {
			if (params.mediaType == 'application/internal') {
				resultType = 'internal'
			}
			else if (params.mediaType.endsWith('/json') || params.mediaType.endsWith('+json')) {
				resultType = 'json'
			}
			else if (params.mediaType.endsWith('/xml') || params.mediaType.endsWith('+xml')) {
				resultType = 'xml'
			}
			else if (params.mediaType == 'application/object') {
				resultType = 'object'
			}
			else {
				resultType = 'text'
			}
		}
		if (!Sincerity.Objects.exists(resultHeaders) && (params.method == 'head')) {
			resultHeaders = true
		}

		if (Sincerity.Objects.exists(params.payload) && params.payload.type) {
			var mediaType = params.payload.mediaType
			switch (String(params.payload.type)) {
				case 'internal':
					params.payload = new com.threecrickets.prudence.util.InternalRepresentation(params.payload.value)
					break

				case 'text':
					// Payload is as is
					break

				case 'json':
					params.payload = Sincerity.JSON.to(params.payload.value)
					mediaType = mediaType || 'application/json'
					if (Sincerity.Objects.exists(params.payload)) {
						params.payload = new org.restlet.representation.StringRepresentation(params.payload, org.restlet.data.MediaType.valueOf(mediaType))
					}
					break

				case 'xml':
					params.payload = Sincerity.XML.to(params.payload.value)
					mediaType = mediaType || 'application/xml'
					if (Sincerity.Objects.exists(params.payload)) {
						params.payload = new org.restlet.representation.StringRepresentation(params.payload, org.restlet.data.MediaType.valueOf(mediaType))
					}
					break

				case 'web':
					params.payload = Public.toWebPayload(params.payload.value)
					break

				case 'binary':
					params.payload = new org.restlet.representation.ByteArrayRepresentation(params.payload.value, Sincerity.Objects.exists(mediaType) ? org.restlet.data.MediaType.valueOf(mediaType) : null)
					break

				case 'object':
					mediaType = mediaType || 'application/object'
					params.payload = new org.restlet.representation.ObjectRepresentation(params.payload.value, org.restlet.data.MediaType.valueOf(mediaType))
					break

				default:
					Public.logger.warning('Unsupported payload type: ' + params.payload.type)
					params.payload = null
					break
			}
		}

		var resource
		
		while (Sincerity.Objects.exists(params.file) || params.uri) {
			if (Sincerity.Objects.exists(params.file)) {
				params.file = Sincerity.Objects.isString(params.file) ? new java.io.File(params.file) : params.file
				params.uri = params.file.toURI()
				resource = document.external(params.uri, params.mediaType)
				delete params.file
				delete params.uri
			}
			else {
				params.uri = params.query ? Prudence.Resources.buildUri(params.uri, params.query) : params.uri
				if (params.internal) {
					if (Sincerity.Objects.isString(params.internal)) {
						resource = document.internalOther(params.internal, params.uri, params.mediaType)
					}
					else {
						resource = document.internal(params.uri, params.mediaType)
					}
				}
				else {
					resource = document.external(params.uri, params.mediaType)
				}
				delete params.uri
			}

			if (!params.retry) {
				resource.retryOnError = false
				resource.retryAttempts = 0
			}
			else {
				resource.retryOnError = true
				resource.retryAttempts = params.retry
			}

			if (params.headers) {
				resource.request.attributes.put('org.restlet.http.headers', Public.toHeaders(params.headers))
			}
			
			if (params.authorization) {
				var scheme = params.authorization.type
				if (Sincerity.Objects.isString(scheme)) {
					// Get registered scheme
					var scheme = org.restlet.data.ChallengeScheme.valueOf(scheme)
					var helper = org.restlet.engine.Engine.instance.findHelper(scheme, true, false)
					if (Sincerity.Objects.exists(helper)) {
						scheme = helper.challengeScheme
					}
					else {
						scheme = new org.restlet.data.ChallengeScheme(params.authorization.type, params.authorization.type)
					}
				}
				var challengeResponse = new org.restlet.data.ChallengeResponse(scheme)
				delete params.authorization.type
				Sincerity.Objects.merge(challengeResponse, params.authorization)
				resource.challengeResponse = challengeResponse
			}

			try {
				var representation
				switch (params.method) {
					case 'head':
						representation = resource.head()
						break
						
					case 'get':
						representation = resource.get()
						break
						
					case 'delete':
						representation = resource['delete']()
						break
						
					case 'post':
						representation = resource.post(Sincerity.Objects.exists(params.payload) ? params.payload : '')
						break
						
					case 'put':
						representation = resource.put(Sincerity.Objects.exists(params.payload) ? params.payload : '')
						break
						
					default:
						Public.logger.warning('Unsupported method: ' + params.method)
						break
				}
				
				if (Sincerity.Objects.exists(resource.response.locationRef)) {
					params.uri = String(resource.response.locationRef)
					Public.logger.fine('Following redirect: ' + params.uri)
					continue
				}

				if (resultType == 'entity') {
					return representation
				}

				try {
					if (resultType == 'date') {
						return new Date(resource.response.date.time)
					}
					
					if (Sincerity.Objects.exists(representation)) {
						var result = Public.fromRepresentation(representation, resultType, params.result)
						if (resultHeaders) {
							result = {
								representation: result
							}
							var headers = resource.response.attributes.get('org.restlet.http.headers')
							if (Sincerity.Objects.exists(headers)) {
								result.headers = Public.fromNamedValueList(headers)
							}
						}
						return result
					}
					else {
						return null
					}
				}
				finally {
					if (Sincerity.Objects.exists(representation)) {
						representation.release()
					}
				}
			}
			catch (x if Sincerity.JVM.isException(x, org.restlet.resource.ResourceException)) {
				Public.logger.log(params.logLevel, function() {
					var text = resource.response.entity ? String(resource.response.entity.text).trim() : null
					return String(x.javaException || x) + (text ? ': ' + text : '') + '\n' + Sincerity.Platform.getStackTrace(x) + '\nRequest params: ' + Sincerity.JSON.to(params, true) 
				})
				
				if (resultType == 'date') {
					return new Date(resource.response.date.time)
				}
				
				if (resultHeaders) {
					var headers = resource.response.attributes.get('org.restlet.http.headers')
					if (Sincerity.Objects.exists(headers)) {
						return {
							headers: Public.fromNamedValueList(headers)
						}
					}
				}
			}
			finally {
				resource.response.release()
			}
		}
		
		return null
	}
	
	/**
	 * Shortcut to internally request a /web/dynamic/ or /web/static/ URI.
	 * Can also work on /resources/ if they support the 'text/html' media type.
	 * 
	 * @returns {String} The raw HTML
	 */
	Public.generateHtml = function(uri, payload) {
		if (payload) {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'text/html',
				method: 'post',
				payload: {
					type: 'object',
					value: payload
				}
			})
		}
		else {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'text/html'
			})
		}
	}
	
	/**
	 * Shortcut to internally request a /web/dynamic/ or /web/static/ URI.
	 * Can also work on /resources/ if they support the 'application/xml' media type.
	 * 
	 * @returns {String} The raw XML
	 */
	Public.generateXML = function(uri, payload) {
		if (payload) {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'application/xml',
				method: 'post',
				payload: {
					type: 'object',
					value: payload
				},
				result: 'text'
			})
		}
		else {
			return Public.request({
				uri: uri,
				internal: true,
				mediaType: 'application/xml',
				result: 'text'
			})
		}
	}

	/**
	 * Adds query parameters to a URI, after properly encoding them.
	 * The URI may already have query parameters.
	 * 
	 * @param {String} uri A URI (with or without a query)
	 * @param {Object} query A dict of query parameters 
	 * @returns {String} The URI with the additional query parameters
	 */
	Public.buildUri = function(uri, query) {
		var reference = new org.restlet.data.Reference(uri)
		reference.query = Public.toForm(query).queryString
		return String(reference)
	}
	
	/**
	 * Converts a query string into a dict.
	 * 
	 * @param query The query string
	 * @param [keys] See {@link Prudence.Resources#fromAttributeMap}
	 */
	Public.fromQueryString = function(query, keys) {
		var form = new org.restlet.data.Form(query)
		return Public.fromAttributeMap(form.valuesMap, form, keys)
	}

	/**
	 * Converts a Restlet NamedValue list into a dict.
	 * 
	 * @param list The NamedValue list
	 * @returns A dict
	 */
	Public.fromNamedValueList = function(list) {
		var namedValues = {}
		for (var i = list.iterator(); i.hasNext(); ) {
			var namedValue = i.next()
			namedValues[namedValue.name] = String(namedValue.value)
		}
		return namedValues
	}
	
	/**
	 * Converts a multi-line property sheet into a dict.
	 * 
	 * @param {String} text The property sheet
	 * @param {String} separator The separator between property name and value
	 * @returns A dict
	 */
	Public.fromPropertySheet = function(text, separator) {
		text = String(text).split('\n')
		var properties = {}
		for (var t in text) {
			var line = text[t].split(separator)
			if (line.length == 2) {
				properties[line[0]] = line[1]
			}
		}
		return properties
	}
	
	/**
	 * Converts a Restlet Representation into the desired type.
	 * 
	 * @param {<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/index.html?org/restlet/representation/Representation.html">org.restlet.representation.Representation</a>} representation The Restlet Representation
	 * @param {String} type Supported types:
	 * <ul>
	 * <li>'text'</li>
	 * <li>'json': see {@link Sincerity.JSON#from}</li>
	 * <li>'extendedJson': see {@link Sincerity.JSON#from}</li>
	 * <li>'xml': see {@link Sincerity.XML#from}</li>
	 * <li>'web': see {@link Prudence.Resources#fromQueryString}</li>
	 * <li>'binary': an array of bytes</li>
	 * <li>'properties': see {@link Prudence.Resources#fromPropertySheet} (using params.separator)</li>
	 * <li>'object': a JVM-serializable object</li>
	 * <li>'internal': an arbitrary object (only useful for internal conversations)</li>
	 * </ul>
	 * @param [params] Optional params for some conversions
	 * @returns The representation
	 */
	Public.fromRepresentation = function(representation, type, params) {
		switch (String(type)) {
			case 'internal':
			case 'object':
				var object = representation.object
				if (Sincerity.Objects.exists(object)) {
					return object
				}
				break
				
			case 'text':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					return String(text)
				}
				return ''
				
			case 'json':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					try {
						return Sincerity.JSON.from(text)
					} 
					catch (x) {
						Public.logger.warning('Malformed JSON representation: ' + text)
					}
				}
				return {} 
				
			case 'extendedJson':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					try {
						return Sincerity.JSON.from(text, true)
					} 
					catch (x) {
						Public.logger.warning('Malformed JSON representation: ' + text)
					}
				}
				return {}
				
			case 'xml':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					try {
						return Sincerity.XML.from(text)
					} 
					catch (x) {
						Public.logger.warning('Malformed XML representation: ' + text)
					}
				}
				return null
				
			case 'web':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					return Public.fromQueryString(text, params ? params.keys : null)
				}
				return {}
			
			case 'binary':
				var size = representation.size
				if (size != -1) {
					var channel = representation.channel
					if (Sincerity.Objects.exists(channel)) {
						var buffer = java.nio.ByteBuffer.allocate(size)
						channel.read(buffer)
						return buffer.array()
					}
				}
				return null
				
			case 'properties':
				var text = representation.text
				if (Sincerity.Objects.exists(text)) {
					return Public.fromPropertySheet(text, params.separator || ':')
				}
				return {}
				
			default:
				Public.logger.warning('Unsupported representation type: ' + type)
				break
		}
		
		return null
	},

	/**
	 * Converts an attribute map into a dict.
	 *
	 * @param {<a href="http://docs.oracle.com/javase/6/docs/api/index.html?java/util/Map.html">java.util.Map</a>} map The map
	 * @param {<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/index.html?org/restlet/util/Series.html">org.restlet.util.Series</a>&lt;<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/jse/engine/index.html?org/restlet/engine/header/Header.html">org.restlet.engine.header.Header</a>&gt;} [series] The series (in order to support arrays)
	 * @param [keys] A dict where keys are attribute names and values are types. Supported types:
	 *		<ul>
	 *		<li>'string': no conversion</li>
	 *		<li>'int': parseInt</li>
	 *		<li>'float': parseFloat</li>
	 *		<li>'bool': must be 'true' or 'false'</li>
	 *		<li>'date': Unix timestamp</li>
	 *		<li>'json': see {@link Sincerity.JSON#from}</li>
	 *		<li>'extendedJson': see {@link Sincerity.JSON#from}</li>
	 *		<li>'xml': see {@link Sincerity.XML#from}</li>
	 *		</ul>
	 *		Add '[]' to any type to signify that you want an array of all values.
	 *		When no keys are supplied, the entire map is converted to a dict of strings.
	 * @returns A dict
	 */
	Public.fromAttributeMap = function(map, series, keys) {
		var attributes = {}

		if (keys) {
			for (var k in keys) {
				var type = keys[k]
				var values
				
				var isArray = false
				if (type.endsWith('[]')) {
					type = type.substring(0, type.length - 2)
					values = Sincerity.JVM.fromArray(series.getValuesArray(k))
					isArray = true
				}
				else {
					var value = map.get(k)
					values = Sincerity.Objects.exists(value) ? [value] : []
				}

				for (var v in values) {
					var value = values[v]
					switch (type) {
						case 'int':
							value = parseInt(value)
							if (isNaN(value)) {
								value = null
							}
							break
							
						case 'float':
							value = parseFloat(value)
							if (isNaN(value)) {
								value = null
							}
							break
							
						case 'bool':
							if (value == 'true') {
								value = true
							}
							else 
								if (value == 'false') {
									value = false
								}
								else {
									value = null
								}
							break
							
						case 'date':
							value = parseFloat(value)
							if (isNaN(value)) {
								value = null
							}
							else {
								value = new Date(value)
							}
							break
							
						case 'json':
							try {
								value = Sincerity.JSON.from(value)
							}
							catch (x) {
								Public.logger.warning('Malformed JSON attribute: ' + value)
							}
							break
							
						case 'extendedJson':
							try {
								value = Sincerity.JSON.from(value, true)
							}
							catch (x) {
								Public.logger.warning('Malformed JSON attribute: ' + value)
							}
							break
							
						case 'xml':
							try {
								value = Sincerity.XML.from(value)
							}
							catch (x) {
								Public.logger.warning('Malformed XML attribute: ' + value)
							}
							break
							
						case 'string':
						default:
							value = Sincerity.Objects.exists(value) ? String(value) : null
							break
					}
				
					if (Sincerity.Objects.exists(value)) {
						if (isArray) {
							if (!attributes[k]) {
								attributes[k] = []
							}
							attributes[k].push(value)
						}
						else {
							attributes[k] = value
						}
					}
				}
			}
		}
		else {
			for (var i = map.entrySet().iterator(); i.hasNext(); ) {
				var entry = i.next()
				if (Sincerity.Objects.exists(entry.value)) {
					attributes[entry.key] = String(entry.value)
				}
			}
		}
		
		return attributes
	}

	/**
	 * Converts a dict into a Restlet Form.
	 * <p>
	 * Values that are arrays will be considered as multiple values
	 * for a form field.
	 * 
	 * @param dict
	 * @returns {<a href="http://restlet.com/learn/javadocs/2.2/jse/api/index.html?org/restlet/data/Form.html">org.restlet.data.Form</a>}
	 */
	Public.toForm = function(dict) {
		var form = new org.restlet.data.Form()
		for (var d in dict) {
			var value = dict[d]
			if (Sincerity.Objects.isArray(value)) {
				for (i in value) {
					form.add(d, String(value[i]))
				}
			}
			else if (null !== value) {
				form.add(d, String(value))
			}
		}
		return form
	}

	/**
	 * Converts a dict into a Restlet's headers format.
	 * 
	 * @param dict
	 * @returns {<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/index.html?org/restlet/util/Series.html">org.restlet.util.Series</a>&lt;<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/jse/engine/index.html?org/restlet/data/Header.html">org.restlet.data.Header</a>&gt;}
	 */
	Public.toHeaders = function(dict) {
		importClass(
			org.restlet.util.Series)

		var series = new Series(Sincerity.JVM.getClass('org.restlet.data.Header'))
		for (var d in dict) {
			var value = dict[d]
			if (null !== value) {
				series.set(d, String(value))
			}
		}
		return series
	}

	/**
	 * Converts a dict into an HTML form payload.
	 * 
	 * @returns {<a href="http://restlet.com/technical-resources/restlet-framework/javadocs/2.3/jse/api/index.html?org/restlet/representation/Representation.html">org.restlet.representation.Representation</a>}
	 */
	Public.toWebPayload = function(dict) {
		return Public.toForm(dict).webRepresentation
	}

	return Public
}()
