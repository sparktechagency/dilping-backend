import { Model, Types } from 'mongoose';
import { IUser } from '../user/user.interface';

export type ICustomer = {
  _id:Types.ObjectId
  user:Types.ObjectId | IUser
  createdAt:Date
  updatedAt:Date
};



export type CustomerModel ={
  getCustomerId(userId:Types.ObjectId):Promise<Types.ObjectId>
}& Model<ICustomer>;
