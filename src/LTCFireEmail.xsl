<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
    <xsl:output omit-xml-declaration="yes" media-type="html" method="html" indent="yes" doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN" />
    <xsl:param name="param1" />
    <xsl:param name="param2" />
    <xsl:param name="param3" />
    <xsl:param name="param4" />
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        </head>
        <body>
            <p>
                This email is to notify you that the Fire Review Report with ID <strong><xsl:value-of select="$param1" /></strong> and from the home of <strong><xsl:value-of select="$param3" /></strong> was recently 
                <xsl:if test="$param2 = 'notify'"><strong>sent to the Emergency Management Captain for review</strong>.  If you are the Emergency Management Captain, please review the report and fill in any remaining details before submitting to the Administrator.</xsl:if>
                <xsl:if test="$param2 = 'submit'"><strong>submitted to the Administrator for review</strong>.</xsl:if>
                <xsl:if test="$param2 = 'approve'"><strong>approved by the Administrator</strong>.</xsl:if>
                <xsl:if test="$param2 = 'reject'"><strong>rejected by the Administrator</strong>.  If you are the Incident Manager or Emergency Management Captain, please review the Comments in the report and address any issues before resubmitting to the Administrator.</xsl:if>
            </p>
            <p>
                Please click <a href="{concat('https://was8-intra-dev.toronto.ca/webapps/ltc_fire/#/', $param1)}">this link</a> to review the Fire Review Report.
            </p>
        </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
