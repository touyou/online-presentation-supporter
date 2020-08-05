import React from "react";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/core";

interface Props {
  countOfAttendees: number;
}

const Attendees = (props: Props) => {
  return (
    <Stat borderWidth="2px" rounded="lg" m="4" p="4">
      <StatLabel>Attendees</StatLabel>
      <StatNumber>{props.countOfAttendees}</StatNumber>
    </Stat>
  );
};

Attendees.getInitialProps = () => {
  return {
    countOfAttendees: 0,
  };
};

export default Attendees;
