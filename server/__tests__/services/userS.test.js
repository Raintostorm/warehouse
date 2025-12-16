const UserS = require('../../services/userS');
const UsersM = require('../../models/usersM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, generateId } = require('../helpers/testData');
const bcrypt = require('bcrypt');

describe('UserService', () => {
    let testUser;
    let testUserPassword = 'TestPassword123';

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('createUser', () => {
        test('should create user with valid data', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;

            const user = await UserS.createUser(userData);

            expect(user).toBeDefined();
            expect(user.id).toBe(userData.id);
            expect(user.email).toBe(userData.email);
            expect(user.password).not.toBe(testUserPassword); // Should be hashed
        });

        test('should hash password before storing', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;

            const user = await UserS.createUser(userData);

            // UserS.createUser strips password from response, so check database directly
            const dbUser = await UsersM.findById(user.id);
            const dbPassword = dbUser.password || dbUser.Password;

            // Password should be hashed (bcrypt hash is ~60 chars)
            expect(dbPassword).toBeDefined();
            expect(dbPassword.length).toBeGreaterThan(50);
            expect(dbPassword).not.toBe(testUserPassword);
        });

        test('should throw error if ID already exists', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;
            await UserS.createUser(userData);

            // Try to create with same ID
            await expect(UserS.createUser(userData)).rejects.toThrow('already exists');
        });

        test('should throw error if email already exists', async () => {
            const userData1 = testUsers.create();
            userData1.password = testUserPassword;
            await UserS.createUser(userData1);

            const userData2 = testUsers.create();
            userData2.email = userData1.email; // Same email
            userData2.password = testUserPassword;

            await expect(UserS.createUser(userData2)).rejects.toThrow('already exists');
        });

        test('should throw error if missing required fields', async () => {
            const incompleteUser = {
                email: 'test@example.com'
                // Missing id, fullname
            };

            await expect(UserS.createUser(incompleteUser)).rejects.toThrow('Missing required fields');
        });
    });

    describe('findById', () => {
        test('should find user by id', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;
            const createdUser = await UserS.createUser(userData);

            const foundUser = await UserS.findById(createdUser.id);

            expect(foundUser).toBeDefined();
            expect(foundUser.id).toBe(createdUser.id);
        });

        test('should throw error if user not found', async () => {
            await expect(UserS.findById('NON_EXISTENT')).rejects.toThrow('User not found');
        });

        test('should throw error if ID is missing', async () => {
            await expect(UserS.findById('')).rejects.toThrow('ID is required');
        });
    });

    describe('updateUser', () => {
        test('should update user', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;
            const createdUser = await UserS.createUser(userData);

            const updateData = {
                fullname: 'Updated Name',
                address: 'New Address'
            };

            const updatedUser = await UserS.updateUser(createdUser.id, updateData);

            expect(updatedUser.fullname).toBe('Updated Name');
            expect(updatedUser.address).toBe('New Address');
        });

        test('should hash password when updating', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;
            const createdUser = await UserS.createUser(userData);

            const updateData = {
                password: 'NewPassword123'
            };

            const updatedUser = await UserS.updateUser(createdUser.id, updateData);

            // UserS.updateUser strips password from response, so check database directly
            const dbUser = await UsersM.findById(createdUser.id);
            const dbPassword = dbUser.password || dbUser.Password;

            // Password should be hashed
            expect(dbPassword).toBeDefined();
            expect(dbPassword).not.toBe('NewPassword123');
            expect(dbPassword.length).toBeGreaterThan(50);
        });

        test('should throw error if user not found', async () => {
            const updateData = { fullname: 'Updated Name' };

            await expect(UserS.updateUser('NON_EXISTENT', updateData)).rejects.toThrow('User not found');
        });

        test('should throw error if email already exists', async () => {
            const user1 = testUsers.create();
            user1.password = testUserPassword;
            await UserS.createUser(user1);

            const user2 = testUsers.create();
            // Ensure user2 has a different number to avoid "Number already exists" error
            // Generate a unique number (max 15 chars)
            const timestamp = Date.now();
            user2.number = `0${timestamp.toString().slice(-14)}`; // Ensure it's within 15 char limit
            user2.password = testUserPassword;
            const createdUser2 = await UserS.createUser(user2);

            // Try to update user2 with user1's email
            const updateData = { email: user1.email };

            await expect(UserS.updateUser(createdUser2.id, updateData)).rejects.toThrow('already exists');
        });
    });

    describe('deleteUser', () => {
        test('should delete user', async () => {
            const userData = testUsers.create();
            userData.password = testUserPassword;
            const createdUser = await UserS.createUser(userData);

            const deletedUser = await UserS.deleteUser(createdUser.id);

            expect(deletedUser).toBeDefined();
            expect(deletedUser.id).toBe(createdUser.id);

            // Verify user is deleted
            await expect(UserS.findById(createdUser.id)).rejects.toThrow('User not found');
        });

        test('should throw error if user not found', async () => {
            await expect(UserS.deleteUser('NON_EXISTENT')).rejects.toThrow('User not found');
        });
    });
});
