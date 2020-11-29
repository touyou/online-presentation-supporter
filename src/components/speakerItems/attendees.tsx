import React from "react";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/core";

interface Props {
  countOfAttendees: number;
  countOfAllAttendees: number;
}

const Attendees = (props: Props) => {
  return (
    <Stat borderWidth="2px" rounded="lg" m="4" p="4">
      <StatLabel>Attendees</StatLabel>
      <StatNumber>顔認識成功: {props.countOfAttendees}</StatNumber>
      <StatNumber>全参加者: {props.countOfAllAttendees}</StatNumber>
    </Stat>
  );
};

Attendees.getInitialProps = () => {
  return {
    countOfAttendees: 0,
  };
};

export default Attendees;
