import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IMessage } from './message.interface';
import { Message } from './message.model';

const createMessage = async (payload: IMessage) => {
  const result = await Message.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Message',
    );
  return result;
};

const getAllMessages = async () => {
  const result = await Message.find();
  return result;
};

const getSingleMessage = async (id: string) => {
  const result = await Message.findById(id);
  return result;
};

const updateMessage = async (
  id: string,
  payload: Partial<IMessage>,
) => {
  const result = await Message.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  );
  return result;
};

const deleteMessage = async (id: string) => {
  const result = await Message.findByIdAndDelete(id);
  return result;
};

export const MessageServices = {
  createMessage,
  getAllMessages,
  getSingleMessage,
  updateMessage,
  deleteMessage,
};
