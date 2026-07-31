import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipcode: { type: String },
    country: { type: String },
    phone: { type: String },
    date: { type: Number, required: true }
})

const addressModel = mongoose.models.address || mongoose.model('address', addressSchema)

export default addressModel