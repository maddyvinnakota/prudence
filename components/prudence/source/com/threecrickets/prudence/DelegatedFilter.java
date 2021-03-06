/**
 * Copyright 2009-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the LGPL version 3.0:
 * http://www.gnu.org/copyleft/lesser.html
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.threecrickets.prudence;

import org.restlet.Context;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.routing.Filter;
import org.restlet.routing.Redirector;

import com.threecrickets.prudence.util.CapturingRedirector;

/**
 * A {@link Filter} that wraps an underlying {@link DelegatedHandler}.
 * <p>
 * Supported entry points are:
 * <ul>
 * <li><code>handleBefore(conversation)</code></li>
 * <li><code>handleAfter(conversation)</code></li>
 * </ul>
 * <p>
 * The handleBefore entry point should return a string which an action. It can
 * be either "continue", "skip", or "stop" for the usual filter actions.
 * However, if the string begins with a "/", it will be treated as a redirection
 * using {@link CapturingRedirector}.
 * 
 * @author Tal Liron
 */
public class DelegatedFilter extends Filter
{
	//
	// Construction
	//

	/**
	 * Constructor.
	 * 
	 * @param context
	 *        The context
	 * @param documentName
	 *        The document name
	 */
	public DelegatedFilter( Context context, String documentName )
	{
		this( context, null, documentName );
	}

	/**
	 * Constructor.
	 * 
	 * @param context
	 *        The context
	 * @param next
	 *        The next restlet
	 * @param documentName
	 *        The document name
	 */
	public DelegatedFilter( Context context, Restlet next, String documentName )
	{
		super( context, next );
		describe();
		delegatedHandler = new DelegatedHandler( documentName, context );
	}

	//
	// Attributes
	//

	/**
	 * @return The entry point name for handleBefore
	 * @see #setEntryPointNameForBefore(String)
	 */
	public String getEntryPointNameForBefore()
	{
		return entryPointNameForBefore;
	}

	/**
	 * @param entryPointNameForBefore
	 *        The entry point name for handleBefore
	 * @see #getEntryPointNameForBefore()
	 */
	public void setEntryPointNameForBefore( String entryPointNameForBefore )
	{
		this.entryPointNameForBefore = entryPointNameForBefore;
	}

	/**
	 * @return The entry point name for handleAfter
	 * @see #setEntryPointNameForAfter(String)
	 */
	public String getEntryPointNameForAfter()
	{
		return entryPointNameForAfter;
	}

	/**
	 * @param entryPointNameForAfter
	 *        The entry point name for handleAfter
	 * @see #getEntryPointNameForAfter()
	 */
	public void setEntryPointNameForAfter( String entryPointNameForAfter )
	{
		this.entryPointNameForAfter = entryPointNameForAfter;
	}

	/**
	 * @return The default action to use for <code>handleBefore()</code> if none
	 *         is specified
	 * @see #setDefaultAction(int)
	 */
	public int getDefaultBeforeAction()
	{
		return defaultBeforeAction;
	}

	/**
	 * @param defaultBeforeAction
	 *        The default action to use for <code>handleBefore()</code> if none
	 *        is specified
	 * @see #getDefaultBeforeAction()
	 */
	public void setDefaultAction( int defaultBeforeAction )
	{
		this.defaultBeforeAction = defaultBeforeAction;
	}

	//
	// Object
	//

	@Override
	public String toString()
	{
		if( delegatedHandler == null )
			return getClass().getSimpleName() + " -> " + getNext();
		else
			return getClass().getSimpleName() + ": \"" + delegatedHandler.getDocumentName() + "\" -> " + getNext();
	}

	// //////////////////////////////////////////////////////////////////////////
	// Protected

	//
	// Filter
	//

	@Override
	protected int beforeHandle( Request request, Response response )
	{
		Object r = delegatedHandler.handleWithConversation( entryPointNameForBefore );

		if( r instanceof Number )
			// Returned number
			return ( (Number) r ).intValue();
		else if( r != null )
		{
			// Returned string
			String action = r.toString();
			if( action != null )
			{
				if( action.startsWith( "/" ) )
				{
					// Capture!
					String reference = "riap://application" + action + "?{rq}";
					Redirector redirector = new CapturingRedirector( delegatedHandler.getAttributes().getContext(), reference );
					redirector.handle( request, response );
					return STOP;
				}

				action = action.toUpperCase();
				if( action.equals( "CONTINUE" ) )
					return CONTINUE;
				else if( action.equals( "SKIP" ) )
					return SKIP;
				else if( action.equals( "STOP" ) )
					return STOP;
			}
		}

		return defaultBeforeAction;
	}

	@Override
	protected void afterHandle( Request request, Response response )
	{
		delegatedHandler.handleWithConversation( entryPointNameForAfter );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	/**
	 * The delegated handler.
	 */
	private final DelegatedHandler delegatedHandler;

	/**
	 * The name of the <code>handleBefore()</code> entry point in the
	 * executable.
	 */
	private volatile String entryPointNameForBefore = "handleBefore";

	/**
	 * The name of the <code>handleAfter()</code> entry point in the executable.
	 */
	private volatile String entryPointNameForAfter = "handleAfter";

	/**
	 * The default action to use for <code>handleBefore()</code> if none is
	 * specified.
	 */
	private volatile int defaultBeforeAction = CONTINUE;

	/**
	 * Add description.
	 */
	private void describe()
	{
		setOwner( "Prudence" );
		setAuthor( "Three Crickets" );
		setName( getClass().getSimpleName() );
		setDescription( "A filter that wraps an underlying DelegatedHandler" );
	}
}
