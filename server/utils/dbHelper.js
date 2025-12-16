/**
 * Database Helper - Tự động detect và query đúng schema (PascalCase hoặc snake_case)
 */
const db = require('../db');

// Cache schema detection
let schemaType = null;

/**
 * Detect schema type (PascalCase hoặc snake_case)
 */
async function detectSchema() {
    if (schemaType) {
        return schemaType;
    }

    try {
        // Thử query snake_case
        await db.query('SELECT 1 FROM users LIMIT 1');
        schemaType = 'snake_case';
        return schemaType;
    } catch (error) {
        // Nếu snake_case fail, thử PascalCase
        try {
            await db.query('SELECT 1 FROM "Users" LIMIT 1');
            schemaType = 'pascal_case';
            return schemaType;
        } catch (err) {
            // Nếu cả 2 đều fail, mặc định là snake_case
            console.warn('Could not detect schema, defaulting to snake_case');
            schemaType = 'snake_case';
            return schemaType;
        }
    }
}

/**
 * Query với auto-fallback cho cả 2 schemas
 */
async function queryWithFallback(querySnakeCase, queryPascalCase, params = []) {
    try {
        // Thử snake_case trước
        const result = await db.query(querySnakeCase, params);
        return result;
    } catch (error) {
        // Nếu snake_case fail và có lỗi "does not exist" hoặc "column", thử PascalCase
        if (error.message.includes('does not exist') || 
            error.message.includes('relation') || 
            error.message.includes('column') ||
            error.message.includes('Column')) {
            try {
                const result = await db.query(queryPascalCase, params);
                return result;
            } catch (pascalError) {
                throw error; // Throw original error
            }
        }
        throw error;
    }
}

/**
 * Get table name với đúng case
 */
async function getTableName(snakeCaseName, pascalCaseName) {
    const schema = await detectSchema();
    return schema === 'pascal_case' ? `"${pascalCaseName}"` : snakeCaseName;
}

/**
 * Get column name với đúng case
 */
async function getColumnName(snakeCaseName, pascalCaseName) {
    const schema = await detectSchema();
    return schema === 'pascal_case' ? `"${pascalCaseName}"` : snakeCaseName;
}

module.exports = {
    detectSchema,
    queryWithFallback,
    getTableName,
    getColumnName
};

