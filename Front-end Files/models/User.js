// Simple in-memory user storage (replace with database in production)
const bcrypt = require('bcryptjs');

class User {
    constructor() {
        this.users = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@secureguard.com',
                fullName: 'System Administrator',
                password: bcrypt.hashSync('password', 10),
                role: 'admin',
                createdAt: new Date()
            }
        ];
        this.nextId = 2;
    }

    async create(userData) {
        // Check if username or email already exists
        const existingUser = this.users.find(u => 
            u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
            throw new Error('Username or email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create new user
        const newUser = {
            id: this.nextId++,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        };

        this.users.push(newUser);
        return { ...newUser, password: undefined }; // Don't return password
    }

    async findByUsername(username) {
        return this.users.find(u => u.username === username);
    }

    async findByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    async findById(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            return { ...user, password: undefined }; // Don't return password
        }
        return null;
    }

    async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    getAllUsers() {
        return this.users.map(u => ({ ...u, password: undefined }));
    }
}

module.exports = new User();