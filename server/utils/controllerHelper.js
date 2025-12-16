/**
 * Helper functions để giảm code trùng lặp trong controllers
 */

/**
 * Xử lý response thành công
 */
function sendSuccess(res, data, message = 'Operation successful', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
}

/**
 * Xử lý response lỗi với status code phù hợp
 */
function sendError(res, error, defaultMessage = 'Operation failed', defaultStatusCode = 500) {
    let statusCode = defaultStatusCode;
    const errorMessage = error.message || String(error);

    // Xác định status code dựa trên loại lỗi
    if (errorMessage.includes('not found')) {
        statusCode = 404;
    } else if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        statusCode = 409;
    } else if (errorMessage.includes('Missing required fields') ||
        errorMessage.includes('required') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('incorrect')) {
        statusCode = 400;
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        statusCode = 401;
    } else if (errorMessage.includes('forbidden')) {
        statusCode = 403;
    }

    return res.status(statusCode).json({
        success: false,
        message: defaultMessage,
        error: errorMessage
    });
}

/**
 * Wrapper cho CRUD operations với error handling tự động
 */
function createCRUDHandler(service, entityName) {
    return {
        // GET all
        getAll: async (req, res) => {
            try {
                const items = await service.findAll();
                return sendSuccess(res, items, `${entityName}s fetched successfully`);
            } catch (error) {
                return sendError(res, error, `Failed to fetch ${entityName}s`);
            }
        },

        // GET by ID
        getById: async (req, res) => {
            try {
                const item = await service.findById(req.params.id);
                return sendSuccess(res, item, `${entityName} fetched successfully`);
            } catch (error) {
                return sendError(res, error, `Failed to fetch ${entityName}`);
            }
        },

        // CREATE
        create: async (req, res, getActor, auditLogger) => {
            try {
                const actorInfo = getActor(req);
                const itemData = {
                    ...req.body,
                    actor: actorInfo
                };

                const createMethod = service.createProduct || service.createOrder ||
                    service.createWarehouse || service.createSupplier ||
                    service.createUser || service.create;
                const item = await createMethod.call(service, itemData);

                // Log audit nếu có auditLogger
                if (auditLogger) {
                    await auditLogger({
                        tableName: entityName.toLowerCase() + 's',
                        recordId: item.id || item.Id,
                        action: 'CREATE',
                        actor: actorInfo,
                        newData: item,
                        req
                    });
                }

                return sendSuccess(res, item, `${entityName} created successfully`, 201);
            } catch (error) {
                return sendError(res, error, `Failed to create ${entityName}`);
            }
        },

        // UPDATE
        update: async (req, res, getActor, auditLogger) => {
            try {
                const actorInfo = getActor(req);

                // Get old data before update
                const oldItem = await service.findById(req.params.id);

                const itemData = {
                    ...req.body,
                    actor: actorInfo
                };

                const updateMethod = service.updateProduct || service.updateOrder ||
                    service.updateWarehouse || service.updateSupplier ||
                    service.updateUser || service.update;
                const item = await updateMethod.call(service, req.params.id, itemData);

                // Log audit nếu có auditLogger
                if (auditLogger) {
                    await auditLogger({
                        tableName: entityName.toLowerCase() + 's',
                        recordId: item.id || item.Id,
                        action: 'UPDATE',
                        actor: actorInfo,
                        oldData: oldItem,
                        newData: item,
                        req
                    });
                }

                return sendSuccess(res, item, `${entityName} updated successfully`);
            } catch (error) {
                return sendError(res, error, `Failed to update ${entityName}`);
            }
        },

        // DELETE
        delete: async (req, res, getActor, auditLogger) => {
            try {
                const actorInfo = getActor(req);

                // Get old data before delete
                const oldItem = await service.findById(req.params.id);

                const deleteMethod = service.deleteProduct || service.deleteOrder ||
                    service.deleteWarehouse || service.deleteSupplier ||
                    service.deleteUser || service.delete;
                const item = await deleteMethod.call(service, req.params.id);

                // Log audit nếu có auditLogger
                if (auditLogger) {
                    await auditLogger({
                        tableName: entityName.toLowerCase() + 's',
                        recordId: req.params.id,
                        action: 'DELETE',
                        actor: actorInfo,
                        oldData: oldItem,
                        req
                    });
                }

                return sendSuccess(res, item, `${entityName} deleted successfully`);
            } catch (error) {
                return sendError(res, error, `Failed to delete ${entityName}`);
            }
        }
    };
}

module.exports = {
    sendSuccess,
    sendError,
    createCRUDHandler
};
