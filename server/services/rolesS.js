const RolesM = require('../models/rolesM');

const RolesS = {
    findAll: async () => {
        return await RolesM.findAll();
    },
    
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const role = await RolesM.findById(id);
        if (!role) {
            throw new Error('Role not found');
        }
        return role;
    },
    
    createRole: async (roleData) => {
        // Validation
        if (!roleData.id || !roleData.name) {
            throw new Error('Missing required fields: id, name');
        }
        
        // Check if ID exists
        const existingRoleById = await RolesM.findById(roleData.id);
        if (existingRoleById) {
            throw new Error('Role ID already exists');
        }
        
        // Check if name exists
        const existingRoleByName = await RolesM.findByName(roleData.name);
        if (existingRoleByName) {
            throw new Error('Role name already exists');
        }
        
        return await RolesM.create(roleData);
    },
    
    updateRole: async (id, roleData) => {
        // Check role exists
        const existingRole = await RolesM.findById(id);
        if (!existingRole) {
            throw new Error('Role not found');
        }

        // Check if new name conflicts
        if (roleData.name && roleData.name !== existingRole.name) {
            const nameExists = await RolesM.findByName(roleData.name);
            if (nameExists) {
                throw new Error('Role name already exists');
            }
        }

        return await RolesM.update(id, roleData);
    },
    
    deleteRole: async (id) => {
        const existingRole = await RolesM.findById(id);
        if (!existingRole) {
            throw new Error('Role not found');
        }
        return await RolesM.delete(id);
    }
};

module.exports = RolesS;

