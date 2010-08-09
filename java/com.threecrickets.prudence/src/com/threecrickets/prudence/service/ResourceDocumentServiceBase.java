/**
 * Copyright 2009-2010 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the LGPL version 3.0:
 * http://www.opensource.org/licenses/lgpl-3.0.html
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.threecrickets.prudence.service;

import org.restlet.resource.ServerResource;

import com.threecrickets.scripturian.Executable;
import com.threecrickets.scripturian.document.DocumentSource;

/**
 * Document service exposed to executables.
 * 
 * @author Tal Liron
 * @param <R>
 */
public abstract class ResourceDocumentServiceBase<R extends ServerResource> extends DocumentServiceBase
{
	//
	// Construction
	//

	/**
	 * Construction.
	 * 
	 * @param resource
	 *        The resource
	 * @param documentSource
	 *        The document source
	 */
	public ResourceDocumentServiceBase( R resource, DocumentSource<Executable> documentSource )
	{
		super( documentSource );
		this.resource = resource;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Protected

	/**
	 * The resource.
	 */
	protected final R resource;
}