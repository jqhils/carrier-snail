export type ArrivalPush = {
  reminderId: string;
  text: string;
  title: "Carrier Snail arrived";
};

export interface PushSender {
  cancelArrival(reminderId: string): Promise<void> | void;
  sendArrival(push: ArrivalPush): Promise<void> | void;
}
