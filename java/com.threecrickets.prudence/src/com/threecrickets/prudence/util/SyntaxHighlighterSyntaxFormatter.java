package com.threecrickets.prudence.util;

import org.restlet.data.MediaType;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.ResourceException;

public class SyntaxHighlighterSyntaxFormatter implements SourceFormatter
{
	//
	// SourceFormatter
	//

	/**
	 * @see SourceFormatter#formatSource(String, String, String)
	 */
	public Representation formatSource( String source, String name, String tag ) throws ResourceException
	{
		String base = "/prudence-test/";
		String theme = "Midnight";

		String brush = null, alias = null;
		if( "js".equals( tag ) )
		{
			brush = "JScript";
			alias = "js";
		}
		else if( "py".equals( tag ) )
		{
			brush = "Python";
			alias = "py";
		}
		else if( "rb".equals( tag ) )
		{
			brush = "Ruby";
			alias = "rb";
		}
		else if( "gv".equals( tag ) || "groovy".equals( tag ) )
		{
			brush = "Groovy";
			alias = "groovy";
		}
		else if( "php".equals( tag ) )
		{
			brush = "Php";
			alias = "php";
		}

		if( brush == null )
			return new StringRepresentation( source );

		StringBuilder html = new StringBuilder();
		html.append( "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n" );
		html.append( "<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\" lang=\"en\">\n" );
		html.append( "<head>\n" );
		html.append( "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />" );
		html.append( "<title>" + name + " - " + tag + "</title>\n" );
		html.append( "<link href=\"" + base + "syntaxhighlighter/styles/shCore.css\" rel=\"stylesheet\" type=\"text/css\" />\n" );
		html.append( "<link href=\"" + base + "syntaxhighlighter/styles/shTheme" + theme + ".css\" rel=\"stylesheet\" type=\"text/css\" />\n" );
		html.append( "<script type=\"text/javascript\" src=\"" + base + "syntaxhighlighter/src/shCore.js\"></script>\n" );
		html.append( "<script type=\"text/javascript\" src=\"" + base + "syntaxhighlighter/scripts/shBrush" + brush + ".js\"></script>\n" );
		html.append( "<script type=\"text/javascript\">\n" );
		html.append( "SyntaxHighlighter.config.clipboardSwf = 'scripts/clipboard.swf';" );
		html.append( "SyntaxHighlighter.all();\n" );
		html.append( "</script>\n" );
		html.append( "</head>\n" );
		html.append( "<body>\n" );
		html.append( "<script type=\"syntaxhighlighter\" class=\"brush: " + alias + ";\"><![CDATA[" );
		html.append( source );
		html.append( "]]></script>\n" );
		html.append( "</body>\n" );
		html.append( "</html>\n" );

		Representation representation = new StringRepresentation( html );
		representation.setMediaType( MediaType.TEXT_HTML );
		return representation;
	}
}
