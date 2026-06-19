export type ArrivalPush = {
  reminderId: string;
  text: string;
  title: "Carrier Snail arrived";
};

export interface PushSender {
  sendArrival(push: ArrivalPush): Promise<void> | void;
}
