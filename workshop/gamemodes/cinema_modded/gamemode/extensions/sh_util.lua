-- Common functions that are used in Cinema.

module("util", package.seeall)

-- Helper function for converting ISO 8601 time strings; this is the formatting
-- http://en.wikipedia.org/wiki/ISO_8601#Durations
function ISO_8601ToSeconds(str)
	local number = tonumber(str)
	if number then return number end

	str = str:lower()

	local h = str:match("(%d+)h") or 0
	local m = str:match("(%d+)m") or 0
	local s = str:match("(%d+)s") or 0
	return h * (60 * 60) + m * 60 + s
end

function SecondsToISO_8601(seconds)
	local t = string.FormattedTime( seconds )

	return (t.h and t.h .. "h" or "") .. (t.m and t.m .. "m" or "") .. (t.s and t.s .. "s" or "")
end

-- Get the value for an attribute from a html element
function ParseElementAttribute( element, attribute )
	if not element then return end
	-- Find the desired attribute
	local output = element:match( attribute .. "%s-=%s-%b\"\"" )
	if not output then return end
	-- Remove the 'attribute=' part
	output = output:gsub( attribute .. "%s-=%s-", "" )
	-- Trim the quotes around the value string
	return output:sub( 2, -2 )
end

-- Get the contents of a html element by removing tags
-- Used as fallback for when title cannot be found
function ParseElementContent( element )
	if not element then return end
	-- Trim start
	local output = element:gsub( "^%s-<%w->%s-", "" )
	-- Trim end
	return output:gsub( "%s-</%w->%s-$", "" )
end