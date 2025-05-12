import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';

const createChat = async (payload: IChat) => {
  const result = await Chat.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Chat',
    );
  return result;
};

const getAllChats = async () => {
  const result = await Chat.find();
  return result;
};

const getSingleChat = async (id: string) => {
  const result = await Chat.findById(id);
  return result;
};

const updateChat = async (
  id: string,
  payload: Partial<IChat>,
) => {
  const result = await Chat.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  );
  return result;
};

const deleteChat = async (id: string) => {
  const result = await Chat.findByIdAndDelete(id);
  return result;
};

export const ChatServices = {
  createChat,
  getAllChats,
  getSingleChat,
  updateChat,
  deleteChat,
};
