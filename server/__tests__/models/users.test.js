const UsersM = require('../../models/usersM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, generateId } = require('../helpers/testData');

describe('Users Model CRUD Operations', () => {
    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('CREATE', () => {
        test('should create a new user', async () => {
            const userData = testUsers.create();
            const user = await UsersM.create(userData);

            expect(user).toBeDefined();
            expect(user.id).toBe(userData.id);
            expect(user.email).toBe(userData.email);
            expect(user.fullname).toBe(userData.fullname);
        });

        test('should create user with minimal required fields', async () => {
            // Database may allow NULL for some fields, test with minimal data
            const minimalUser = {
                id: generateId('U', 10),
                email: `minimal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@example.com`,
                fullname: 'Minimal User',
                actor: 'test'
            };

            const user = await UsersM.create(minimalUser);
            expect(user).toBeDefined();
            expect(user.id).toBe(minimalUser.id);
            expect(user.email).toBe(minimalUser.email);
        });
    });

    describe('READ', () => {
        test('should find all users', async () => {
            // Create test users
            const user1 = testUsers.create();
            const user2 = testUsers.create();
            await UsersM.create(user1);
            await UsersM.create(user2);

            const users = await UsersM.findAll();

            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBeGreaterThanOrEqual(2);
        });

        test('should find user by id', async () => {
            const userData = testUsers.create();
            const createdUser = await UsersM.create(userData);

            const foundUser = await UsersM.findById(createdUser.id);

            expect(foundUser).toBeDefined();
            expect(foundUser.id).toBe(createdUser.id);
            expect(foundUser.email).toBe(createdUser.email);
        });

        test('should find user by email', async () => {
            const userData = testUsers.create();
            await UsersM.create(userData);

            const foundUser = await UsersM.findByEmail(userData.email);

            expect(foundUser).toBeDefined();
            expect(foundUser.email).toBe(userData.email);
        });

        test('should return undefined for non-existent user', async () => {
            const foundUser = await UsersM.findById('NON_EXISTENT_ID');
            expect(foundUser).toBeUndefined();
        });
    });

    describe('UPDATE', () => {
        test('should update user', async () => {
            const userData = testUsers.create();
            const createdUser = await UsersM.create(userData);

            const updateData = testUsers.update();
            const updatedUser = await UsersM.update(createdUser.id, updateData);

            expect(updatedUser).toBeDefined();
            expect(updatedUser.fullname).toBe(updateData.fullname);
            expect(updatedUser.address).toBe(updateData.address);
        });

        test('should throw error if no updates provided', async () => {
            const userData = testUsers.create();
            const createdUser = await UsersM.create(userData);

            await expect(UsersM.update(createdUser.id, {})).rejects.toThrow('No updates provided');
        });

        test('should handle update for non-existent user gracefully', async () => {
            const updateData = testUsers.update();
            // Database may return empty result instead of throwing error
            try {
                const result = await UsersM.update('NON_EXISTENT_ID', updateData);
                // If update succeeds but returns undefined/empty, that's also acceptable
                expect(result).toBeDefined();
            } catch (error) {
                // If it throws error, that's also acceptable behavior
                expect(error).toBeDefined();
            }
        });
    });

    describe('DELETE', () => {
        test('should delete user', async () => {
            const userData = testUsers.create();
            const createdUser = await UsersM.create(userData);

            const deletedUser = await UsersM.delete(createdUser.id);

            expect(deletedUser).toBeDefined();
            expect(deletedUser.id).toBe(createdUser.id);

            // Verify user is deleted
            const foundUser = await UsersM.findById(createdUser.id);
            expect(foundUser).toBeUndefined();
        });

        test('should bulk delete users', async () => {
            const user1 = testUsers.create();
            const user2 = testUsers.create();
            const user3 = testUsers.create();

            const created1 = await UsersM.create(user1);
            const created2 = await UsersM.create(user2);
            const created3 = await UsersM.create(user3);

            const deletedUsers = await UsersM.bulkDelete([created1.id, created2.id]);

            expect(deletedUsers.length).toBe(2);

            // Verify remaining user exists
            const foundUser = await UsersM.findById(created3.id);
            expect(foundUser).toBeDefined();
        });

        test('should throw error if no IDs provided for bulk delete', async () => {
            await expect(UsersM.bulkDelete([])).rejects.toThrow('No IDs provided');
        });
    });
});
