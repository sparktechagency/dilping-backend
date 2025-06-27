import { Notification } from '../app/modules/notifications/notifications.model'
import { logger } from '../shared/logger'
import { socket } from '../utils/socket'
import { INotification } from '../app/modules/notifications/notifications.interface'

export const sendNotification = async (
data:{
  sender:string,
  receiver:string,
  title:string,
  body:string,
} 
) => {
  try {
    const result = await Notification.create({
      sender: data.sender,
      receiver: data.receiver,
      title: data.title,
      body: data.body,
      isRead: false,
    }).then(doc => 
      doc.populate([
        { path: 'sender', select: 'profile name' },
      ])
    );

    if (!result) {
      logger.warn('Notification not sent');
      return;
    }

    //@ts-ignore
    const socket = global.io;
    socket.emit(`notification::${data.receiver}`, result)
  } catch (err) {
    //@ts-ignore
    logger.error(err, 'FROM NOTIFICATION HELPER')
  }
}


export const sendDataWithSocket = (namespace: string,  receiverId: string, data: any) => {
  try{

      //@ts-ignore
      const socket = global.io;
      socket.emit(`${namespace}::${receiverId}`, {data});
  }catch(error){
      logger.error('Failed to send data with socket:', error);
  }
}