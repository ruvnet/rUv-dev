/**
 * Registry Client Data Models
 * 
 * This module defines the data models used by the Registry Client.
 */

/**
 * Server argument definition
 * 
 * @typedef {Object} ServerArg
 * @property {string} name - Argument name
 * @property {string} description - Argument description
 * @property {boolean} [secret] - Whether the argument contains sensitive information
 * @property {string} [envVar] - Environment variable name for the argument
 * @property {string} [default] - Default value for optional arguments
 */

/**
 * Server list item model
 * 
 * @typedef {Object} ServerListItem
 * @property {string} id - Unique server identifier
 * @property {string} name - Display name
 * @property {string} description - Server description
 * @property {string} version - Server version
 * @property {string} command - Command to run the server
 * @property {string[]} args - Command arguments
 * @property {ServerArg[]} requiredArgs - Required arguments for the server
 * @property {ServerArg[]} optionalArgs - Optional arguments for the server
 * @property {string[]} recommendedPermissions - Recommended permissions
 * @property {string} documentation - Documentation URL
 * @property {string[]} tags - Server tags/categories
 * @property {number} popularity - Popularity rating (0-5)
 */

/**
 * Server example configuration
 * 
 * @typedef {Object} ServerExample
 * @property {string} name - Example name
 * @property {Object} config - Example configuration
 * @property {string} config.command - Command to run the server
 * @property {string[]} config.args - Command arguments
 * @property {string[]} config.alwaysAllow - Permissions to always allow
 */

/**
 * Roomode template
 * 
 * @typedef {Object} RoomodeTemplate
 * @property {string} slug - Unique identifier for the mode
 * @property {string} name - Display name for the mode
 * @property {string} roleDefinition - Role definition for the AI assistant
 * @property {string} customInstructions - Custom instructions for the AI assistant
 * @property {string[]} groups - Permission groups for the mode
 */

/**
 * Server detail model
 * 
 * @typedef {Object} ServerDetail
 * @property {string} id - Unique server identifier
 * @property {string} name - Display name
 * @property {string} description - Server description
 * @property {string} version - Server version
 * @property {string} command - Command to run the server
 * @property {string[]} args - Command arguments
 * @property {ServerArg[]} requiredArgs - Required arguments for the server
 * @property {ServerArg[]} optionalArgs - Optional arguments for the server
 * @property {string[]} recommendedPermissions - Recommended permissions
 * @property {string} documentation - Documentation URL
 * @property {string[]} tags - Server tags/categories
 * @property {number} popularity - Popularity rating (0-5)
 * @property {ServerExample[]} examples - Example configurations
 * @property {RoomodeTemplate} roomodeTemplate - Roomode template
 */

/**
 * Category model
 * 
 * @typedef {Object} Category
 * @property {string} name - Category name
 * @property {number} count - Number of servers in this category
 * @property {string} description - Category description
 */

/**
 * Search result model
 * 
 * @typedef {Object} SearchResult
 * @property {string} id - Unique server identifier
 * @property {string} name - Display name
 * @property {string} description - Server description
 * @property {string} version - Server version
 * @property {string[]} tags - Server tags/categories
 * @property {number} popularity - Popularity rating (0-5)
 * @property {number} relevance - Search relevance score (0-1)
 */

/**
 * Server list response
 * 
 * @typedef {Object} ServerListResponse
 * @property {ServerListItem[]} servers - List of servers
 * @property {Object} meta - Metadata
 * @property {number} meta.total - Total number of servers
 * @property {number} meta.page - Current page number
 * @property {number} meta.pageSize - Number of items per page
 * @property {string} meta.lastUpdated - Last updated timestamp
 */

/**
 * Categories response
 * 
 * @typedef {Object} CategoriesResponse
 * @property {Category[]} categories - List of categories
 */

/**
 * Search response
 * 
 * @typedef {Object} SearchResponse
 * @property {SearchResult[]} results - Search results
 * @property {Object} meta - Metadata
 * @property {number} meta.total - Total number of results
 * @property {string} meta.query - Search query
 * @property {Object} meta.filters - Applied filters
 */

module.exports = {
  // These are just type definitions, no actual code to export
};