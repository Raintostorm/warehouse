/**
 * Helper functions for input validation and sanitization
 */

/**
 * Validate orderDetails array structure
 * @param {Array} orderDetails - Array of order detail objects
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateOrderDetails(orderDetails) {
    const errors = [];

    if (!Array.isArray(orderDetails)) {
        errors.push('orderDetails must be an array');
        return { isValid: false, errors };
    }

    if (orderDetails.length === 0) {
        errors.push('orderDetails array cannot be empty');
        return { isValid: false, errors };
    }

    orderDetails.forEach((detail, index) => {
        if (!detail || typeof detail !== 'object') {
            errors.push(`orderDetails[${index}] must be an object`);
            return;
        }

        // Validate productId
        if (!detail.productId && !detail.product_id && !detail.pid) {
            errors.push(`orderDetails[${index}] is missing productId`);
        } else {
            const productId = detail.productId || detail.product_id || detail.pid;
            if (typeof productId !== 'string' || productId.trim().length === 0) {
                errors.push(`orderDetails[${index}].productId must be a non-empty string`);
            }
        }

        // Validate quantity
        if (detail.quantity === undefined && detail.number === undefined) {
            errors.push(`orderDetails[${index}] is missing quantity`);
        } else {
            const quantity = detail.quantity || detail.number;
            if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
                errors.push(`orderDetails[${index}].quantity must be a positive number`);
            }
        }

        // Validate warehouseId (optional for sale orders, required for import/export)
        if (detail.warehouseId || detail.warehouse_id || detail.wid) {
            const warehouseId = detail.warehouseId || detail.warehouse_id || detail.wid;
            if (typeof warehouseId !== 'string' || warehouseId.trim().length === 0) {
                errors.push(`orderDetails[${index}].warehouseId must be a non-empty string if provided`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize string input (trim whitespace)
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return input;
    }
    return input.trim();
}

/**
 * Validate and sanitize order ID format
 * @param {string} orderId - Order ID to validate
 * @returns {Object} { isValid: boolean, sanitized: string, error?: string }
 */
function validateOrderId(orderId) {
    if (!orderId || typeof orderId !== 'string') {
        return {
            isValid: false,
            sanitized: '',
            error: 'Order ID must be a non-empty string'
        };
    }

    const sanitized = orderId.trim().toUpperCase();
    
    // Validate format: SA, IM, EX, or ORD followed by 6 digits
    if (!/^(SA|IM|EX|ORD)\d{6}$/.test(sanitized)) {
        return {
            isValid: false,
            sanitized,
            error: 'Order ID must start with SA, IM, EX, or ORD followed by 6 digits'
        };
    }

    return {
        isValid: true,
        sanitized
    };
}

/**
 * Validate numeric input
 * @param {*} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} { isValid: boolean, sanitized: number, error?: string }
 */
function validateNumber(value, options = {}) {
    const { min, max, required = true } = options;

    if (value === undefined || value === null) {
        if (required) {
            return {
                isValid: false,
                sanitized: null,
                error: 'Value is required'
            };
        }
        return {
            isValid: true,
            sanitized: null
        };
    }

    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(num)) {
        return {
            isValid: false,
            sanitized: null,
            error: 'Value must be a valid number'
        };
    }

    if (min !== undefined && num < min) {
        return {
            isValid: false,
            sanitized: num,
            error: `Value must be at least ${min}`
        };
    }

    if (max !== undefined && num > max) {
        return {
            isValid: false,
            sanitized: num,
            error: `Value must be at most ${max}`
        };
    }

    return {
        isValid: true,
        sanitized: num
    };
}

module.exports = {
    validateOrderDetails,
    sanitizeString,
    validateOrderId,
    validateNumber
};

