export type ArrivalPush = {
  reminderId: string;
  text: string;
  title: "Carrier Snail arrived";
  /**
   * The carrier user the push is for. Set by the server-side arrival worker so a
   * remote sender can target that user's device. Omitted by the on-device local
   * sender (it notifies the current device and ignores this).
   */
  userId?: string;
};

export interface PushSender {
  cancelArrival(reminderId: string): Promise<void> | void;
  sendArrival(push: ArrivalPush): Promise<void> | void;
}
