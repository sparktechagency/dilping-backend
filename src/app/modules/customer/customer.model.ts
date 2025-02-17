import { Schema, model } from 'mongoose';
import { ICustomer, CustomerModel } from './customer.interface'; 
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';

const customerSchema = new Schema<ICustomer, CustomerModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
},
{
  timestamps: true
});


customerSchema.statics.getCustomerId = async function (userId: Schema.Types.ObjectId) {
  const customer = await this.findOne({ user: userId });
  if(!customer){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }
  return customer?._id;
};

export const Customer = model<ICustomer, CustomerModel>('Customer', customerSchema);
