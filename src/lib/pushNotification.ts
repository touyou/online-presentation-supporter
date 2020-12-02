import { string } from "yup";

export const sendPushNotification = (props: {
  title: string;
  body: string;
  timeout: number;
}) => {
  const { title, body, timeout } = props;
  const Push = require("push.js");
  Push.create(title, { body, timeout });
};
