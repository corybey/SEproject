import mongoose from 'mongoose';
import bcrypt from 'bcrypt';    

//Create a user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }, //uniquely true?
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
//automatically adds createdAt and updatedAt fields
}, {timestamps: true});

//Hash password before saving with error handling
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) 
        return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }  
});

//Method to compare passwords and catch errors
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

//Create a user model
const User = mongoose.model('User', userSchema);
export default User;