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

package com.threecrickets.prudence;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.concurrent.ConcurrentMap;

import org.restlet.Context;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;
import org.restlet.resource.ResourceException;
import org.restlet.resource.ServerResource;

import com.threecrickets.prudence.internal.JygmentsDocumentFormatter;
import com.threecrickets.scripturian.Executable;
import com.threecrickets.scripturian.document.DocumentDescriptor;
import com.threecrickets.scripturian.document.DocumentFormatter;
import com.threecrickets.scripturian.document.DocumentSource;

/**
 * @author Tal Liron
 */
public class SourceCodeResource extends ServerResource
{
	//
	// Constants
	//

	public static final String DOCUMENT = "document";

	public static final String HIGHLIGHT = "highlight";

	//
	// Attributes
	//

	/**
	 * The {@link DocumentSource} used to fetch documents. This must be set to a
	 * valid value before this class is used!
	 * <p>
	 * This setting can be configured by setting an attribute named
	 * <code>com.threecrickets.prudence.SourceCodeResource.documentSources</code>
	 * in the application's {@link Context}.
	 * 
	 * @return The document source
	 */
	@SuppressWarnings("unchecked")
	public Iterable<DocumentSource<Executable>> getDocumentSources()
	{
		if( documentSources == null )
		{
			ConcurrentMap<String, Object> attributes = getContext().getAttributes();
			documentSources = (Iterable<DocumentSource<Executable>>) attributes.get( "com.threecrickets.prudence.SourceCodeResource.documentSources" );

			if( documentSources == null )
				throw new RuntimeException( "Attribute com.threecrickets.prudence.SourceCodeResource.documentSources must be set in context to use SourceCodeResource" );
		}

		return documentSources;
	}

	/**
	 * An optional {@link DocumentFormatter} to use for formatting the source
	 * code. Defaults to a {@link JygmentsDocumentFormatter}.
	 * <p>
	 * This setting can be configured by setting an attribute named
	 * <code>com.threecrickets.prudence.GeneratedtextResource.documentFormatter</code>
	 * in the application's {@link Context}.
	 * 
	 * @return The document formatter or null
	 */
	@SuppressWarnings("unchecked")
	public DocumentFormatter<Executable> getDocumentFormatter()
	{
		if( documentFormatter == null )
		{
			ConcurrentMap<String, Object> attributes = getContext().getAttributes();
			documentFormatter = (DocumentFormatter<Executable>) attributes.get( "com.threecrickets.prudence.SourceCodeResource.documentFormatter" );

			if( documentFormatter == null )
			{
				// documentFormatter = new SyntaxHighlighterDocumentFormatter();
				// documentFormatter = new
				// PygmentsDocumentFormatter<Document>();
				documentFormatter = new JygmentsDocumentFormatter<Executable>();

				DocumentFormatter<Executable> existing = (DocumentFormatter<Executable>) attributes.putIfAbsent( "com.threecrickets.prudence.SourceCodeResource.documentFormatter", documentFormatter );
				if( existing != null )
					documentFormatter = existing;
			}
		}

		return documentFormatter;
	}

	//
	// ServerResource
	//

	@Get("html")
	public Representation getFormattedSourceCodeRepresentation() throws ResourceException
	{
		Form form = getRequest().getResourceRef().getQueryAsForm();
		String document = form.getFirstValue( DOCUMENT );
		String highlightString = form.getFirstValue( HIGHLIGHT );
		int highlight = -1;
		try
		{
			highlight = Integer.parseInt( highlightString );
		}
		catch( Exception x )
		{
		}

		try
		{
			DocumentDescriptor<Executable> documentDescriptor = getDocument( document );
			if( documentDescriptor == null )
				throw new ResourceException( Status.CLIENT_ERROR_NOT_FOUND, document );
			return new StringRepresentation( format( documentDescriptor, highlight ), MediaType.TEXT_HTML );
		}
		catch( IOException x )
		{
			throw new ResourceException( Status.CLIENT_ERROR_NOT_FOUND, document, x );
		}
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private volatile Iterable<DocumentSource<Executable>> documentSources;

	private volatile DocumentFormatter<Executable> documentFormatter;

	private DocumentDescriptor<Executable> getDocument( String name ) throws IOException
	{
		if( name.startsWith( "/" ) )
			name = name.substring( 1 );

		Iterable<DocumentSource<Executable>> documentSources = getDocumentSources();
		if( documentSources != null )
		{
			for( DocumentSource<Executable> documentSource : documentSources )
			{
				try
				{
					DocumentDescriptor<Executable> documentDescriptor = documentSource.getDocument( name );
					if( documentDescriptor != null )
						return documentDescriptor;
				}
				catch( FileNotFoundException x )
				{
				}
			}
		}

		return null;
	}

	private String format( DocumentDescriptor<Executable> documentDescriptor, int highlightLineNumber )
	{
		DocumentFormatter<Executable> documentFormatter = getDocumentFormatter();
		if( documentFormatter != null )
			return documentFormatter.format( documentDescriptor, documentDescriptor.getDefaultName(), highlightLineNumber );
		else
			return documentDescriptor.getSourceCode();
	}
}