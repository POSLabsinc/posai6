import { useEffect } from "react";
import Orders from "./Orders";
import "./PloyPosTheme.css";

const PloyOrders = () => {
  useEffect(() => {
    document.body.classList.add("ploy-orders-active");
    return () => document.body.classList.remove("ploy-orders-active");
  }, []);

  return <Orders themeVariant="ploy" />;
};

export default PloyOrders;