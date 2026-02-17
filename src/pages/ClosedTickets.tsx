// ClosedTickets.tsx - Separate route for paid/closed tickets with additive tip flow
// This page uses the additive tip logic where tips can only be increased, not decreased

import Tickets from "./Tickets";

// Re-export Tickets component with isClosedTicketsMode flag
// This allows the same UI but different tip behavior
const ClosedTickets = () => {
  return <Tickets isClosedTicketsMode={true} />;
};

export default ClosedTickets;
