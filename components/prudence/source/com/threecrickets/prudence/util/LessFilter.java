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

package com.threecrickets.prudence.util;

import java.io.BufferedOutputStream;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringReader;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.restlet.Context;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.routing.Filter;

import com.github.sommeri.less4j.Less4jException;
import com.github.sommeri.less4j.LessCompiler;
import com.github.sommeri.less4j.LessCompiler.CompilationResult;
import com.github.sommeri.less4j.core.TimeoutedLessCompiler;
import com.threecrickets.prudence.internal.CSSMin;

/**
 * A {@link Filter} that automatically parses
 * <a href="http://lesscss.org/">LESS</a> code and renders CSS using the
 * <a href="https://github.com/SomMeri/less4j">Less4j</a> library. Also supports
 * minifying files, if the ".min.css" extension is used. See
 * {@link CssUnifyMinifyFilter}.
 * <p>
 * This filter can track changes to the source files, updating the result file
 * on-the-fly. This makes it easy to develop and debug a live site.
 * <p>
 * Note that this instances of this class can only guarantee atomic access to
 * the rendered CSS file within the current VM.
 * 
 * @author Tal Liron
 */
public class LessFilter extends Filter
{
	//
	// Construction
	//

	/**
	 * Constructor using a 1-second {@link TimeoutedLessCompiler}.
	 * 
	 * @param context
	 *        The context
	 * @param next
	 *        The next restlet
	 * @param targetDirectory
	 *        The directory into which CSS results should be written
	 * @param minimumTimeBetweenValidityChecks
	 *        See {@link #getMinimumTimeBetweenValidityChecks()}
	 */
	public LessFilter( Context context, Restlet next, File targetDirectory, long minimumTimeBetweenValidityChecks )
	{
		this( context, next, targetDirectory, minimumTimeBetweenValidityChecks, new TimeoutedLessCompiler( 1, TimeUnit.SECONDS ) );
	}

	/**
	 * Constructor.
	 * 
	 * @param context
	 *        The context
	 * @param next
	 *        The next restlet
	 * @param targetDirectory
	 *        The directory into which CSS results should be written
	 * @param minimumTimeBetweenValidityChecks
	 *        See {@link #getMinimumTimeBetweenValidityChecks()}
	 * @param lessCompiler
	 *        The LESS compiler
	 */
	public LessFilter( Context context, Restlet next, File targetDirectory, long minimumTimeBetweenValidityChecks, LessCompiler lessCompiler )
	{
		super( context, next );
		this.targetDirectory = targetDirectory;
		this.minimumTimeBetweenValidityChecks = minimumTimeBetweenValidityChecks;
		this.lessCompiler = lessCompiler;
		describe();
	}

	//
	// Attributes
	//

	/**
	 * The directories where the sources are found.
	 * <p>
	 * The set is thread-safe.
	 * 
	 * @return The set of source directories
	 */
	public Set<File> getSourceDirectories()
	{
		return sourceDirectories;
	}

	/**
	 * A value of -1 disables all validity checking.
	 * 
	 * @return The minimum time between validity checks in milliseconds
	 * @see #setMinimumTimeBetweenValidityChecks(long)
	 */
	public long getMinimumTimeBetweenValidityChecks()
	{
		return minimumTimeBetweenValidityChecks;
	}

	/**
	 * @param minimumTimeBetweenValidityChecks
	 *        The minimum time between validity checks in milliseconds
	 * @see #getMinimumTimeBetweenValidityChecks()
	 */
	public void setMinimumTimeBetweenValidityChecks( long minimumTimeBetweenValidityChecks )
	{
		this.minimumTimeBetweenValidityChecks = minimumTimeBetweenValidityChecks;
	}

	//
	// Operations
	//

	/**
	 * Translate LESS to CSS, only if the LESS source is newer. Can optionally
	 * minify the CSS, too.
	 * 
	 * @param lessFile
	 *        The LESS source file
	 * @param cssFile
	 *        The CSS target file (will be overwritten)
	 * @param minify
	 *        Whether to minify the CSS
	 * @throws IOException
	 *         In case of a reading, writing or translation error
	 * @see CSSMin
	 */
	public void translate( File lessFile, File cssFile, boolean minify ) throws IOException
	{
		cssFile = IoUtil.getUniqueFile( cssFile );
		synchronized( cssFile )
		{
			long lastModified = lessFile.lastModified();
			if( lastModified == cssFile.lastModified() )
				return;

			if( cssFile.exists() )
				if( !cssFile.delete() )
					throw new IOException( "Could not delete file: " + cssFile );
			cssFile.getParentFile().mkdirs();

			try
			{
				if( minify )
					getLogger().info( "Translating and minifying LESS: \"" + lessFile + "\" into file \"" + cssFile + "\"" );
				else
					getLogger().info( "Translating LESS: \"" + lessFile + "\" into file \"" + cssFile + "\"" );

				CompilationResult result = lessCompiler.compile( lessFile );
				String css = result.getCss();

				if( minify )
				{
					BufferedOutputStream output = new BufferedOutputStream( new FileOutputStream( cssFile ) );
					try
					{
						CSSMin.formatFile( new StringReader( css ), output );
					}
					finally
					{
						output.close();
					}
				}
				else
				{
					BufferedWriter writer = new BufferedWriter( new FileWriter( cssFile ) );
					try
					{
						writer.write( css );
					}
					finally
					{
						writer.close();
					}
				}
			}
			catch( Less4jException x )
			{
				throw new IOException( "Could not compile LESS file: " + lessFile );
			}

			if( !cssFile.setLastModified( lastModified ) )
				throw new IOException( "Could not update timestamp on file: " + cssFile );
		}
	}

	//
	// Filter
	//

	@Override
	protected int beforeHandle( Request request, Response response )
	{
		Reference reference = request.getResourceRef();
		String path = reference.getRemainingPart( true, false );
		try
		{
			// String name = reference.getLastSegment( true, false );
			String lessPath = null;
			boolean minify = false;
			if( path.endsWith( CSS_MIN_EXTENSION ) )
			{
				lessPath = path.substring( 0, path.length() - CSS_MIN_EXTENSION_LENGTH ) + LESS_EXTENSION;
				minify = true;
			}
			else if( path.endsWith( CSS_EXTENSION ) )
				lessPath = path.substring( 0, path.length() - CSS_EXTENSION_LENGTH ) + LESS_EXTENSION;

			if( lessPath != null )
			{
				long now = System.currentTimeMillis();
				AtomicLong lastValidityCheckAtomic = getLastValidityCheck( path );
				long lastValidityCheck = lastValidityCheckAtomic.get();
				if( lastValidityCheck == 0 || ( now - lastValidityCheck > minimumTimeBetweenValidityChecks ) )
				{
					if( lastValidityCheckAtomic.compareAndSet( lastValidityCheck, now ) )
					{
						for( File sourceDirectory : sourceDirectories )
						{
							File lessFile = new File( sourceDirectory, lessPath );
							if( lessFile.exists() )
							{
								File cssFile = new File( targetDirectory, path );
								translate( lessFile, cssFile, minify );
								break;
							}
						}

						// LESS file was not found, so don't keep the entry for
						// it
						this.lastValidityChecks.remove( path );
					}
				}
			}
		}
		catch( IOException x )
		{
			response.setStatus( Status.SERVER_ERROR_INTERNAL, x );
			return Filter.STOP;
		}

		return Filter.CONTINUE;
	}

	//
	// Object
	//

	@Override
	public String toString()
	{
		return getClass().getSimpleName() + ": \"" + targetDirectory + "\" -> " + getNext();
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static final String CSS_MIN_EXTENSION = ".min.css";

	private static final int CSS_MIN_EXTENSION_LENGTH = CSS_MIN_EXTENSION.length();

	private static final String CSS_EXTENSION = ".css";

	private static final int CSS_EXTENSION_LENGTH = CSS_EXTENSION.length();

	private static final String LESS_EXTENSION = ".less";

	/**
	 * The LESS compiler.
	 */
	private final LessCompiler lessCompiler;

	/**
	 * The directory into which CSS results should be written.
	 */
	private final File targetDirectory;

	/**
	 * The directories where the sources are found.
	 */
	private final CopyOnWriteArraySet<File> sourceDirectories = new CopyOnWriteArraySet<File>();

	/**
	 * See {@link #getMinimumTimeBetweenValidityChecks()}
	 */
	private volatile long minimumTimeBetweenValidityChecks;

	/**
	 * See {@link #getMinimumTimeBetweenValidityChecks()}
	 */
	private final ConcurrentHashMap<String, AtomicLong> lastValidityChecks = new ConcurrentHashMap<String, AtomicLong>();

	/**
	 * Add description.
	 */
	private void describe()
	{
		setOwner( "Prudence" );
		setAuthor( "Three Crickets" );
		setName( getClass().getSimpleName() );
		setDescription( "A filter that automatically translates LESS source files to CSS" );
	}

	private AtomicLong getLastValidityCheck( String key )
	{
		AtomicLong lastValidityCheck = this.lastValidityChecks.get( key );
		if( lastValidityCheck == null )
		{
			lastValidityCheck = new AtomicLong();
			AtomicLong existing = this.lastValidityChecks.putIfAbsent( key, lastValidityCheck );
			if( existing != null )
				lastValidityCheck = existing;
		}
		return lastValidityCheck;
	}
}
